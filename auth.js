// 用户认证功能模块
import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';


// 当前用户状态
let currentUser = null;

// 监听用户认证状态变化
onAuthStateChanged(auth, async (user) => {
  // 如果用户已登录但邮箱未验证（且不是匿名用户），强制登出
  if (user && !user.isAnonymous && !user.emailVerified) {
    console.log('用户邮箱未验证，强制登出');
    await signOut(auth);
    showNotification('您的邮箱尚未验证，请先验证邮箱后再登录。', 'warning');
    return;
  }
  
  currentUser = user;
  // 将认证状态暴露到全局对象
  window.auth = window.auth || {};
  window.auth.currentUser = user;
  updateUIForAuthState(user);
});

// 页面加载时立即检查认证状态并强制显示登录界面（如果未登录）
function initializeAuthState() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    // 用户未登录，立即显示强制登录界面
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
      authModal.style.display = 'block';
      authModal.classList.add('force-login');
      showLoginForm();
    }
    
    // 确保主内容隐藏
    const mainContent = document.querySelector('.content');
    if (mainContent) mainContent.style.display = 'none';
    
    // 确保登录区域显示
    const loginSection = document.getElementById('login-section');
    const userSection = document.getElementById('user-section');
    if (loginSection) loginSection.style.display = 'block';
    if (userSection) userSection.style.display = 'none';
  }
}

// 页面加载完成后立即初始化认证状态
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuthState);
} else {
  initializeAuthState();
}

// 邮箱密码登录
export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 检查邮箱是否已验证
    if (!userCredential.user.emailVerified) {
      // 邮箱未验证，登出用户并提示验证
      await signOut(auth);
      showNotification('请先验证您的邮箱地址。如果没有收到验证邮件，请点击下方按钮重新发送。', 'warning');
      
      // 显示重新发送验证邮件的选项
      showResendVerificationOption(email, password);
      
      throw new Error('邮箱未验证');
    }
    
    console.log('登录成功:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('登录失败:', error);
    
    // 如果是邮箱未验证的错误，不需要再次处理
    if (error.message === '邮箱未验证') {
      throw error;
    }
    
    // 处理常见登录错误
    let errorMessage = '登录失败，请稍后重试';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = '该邮箱尚未注册，请先注册账号';
        break;
      case 'auth/wrong-password':
        errorMessage = '密码错误，请检查后重试';
        break;
      case 'auth/invalid-credential':
        errorMessage = '邮箱或密码错误。如果您刚注册，请先验证邮箱后再登录';
        break;
      case 'auth/invalid-email':
        errorMessage = '邮箱格式不正确，请检查后重试';
        break;
      case 'auth/user-disabled':
        errorMessage = '该账号已被禁用，请联系管理员';
        break;
      case 'auth/too-many-requests':
        errorMessage = '登录尝试次数过多，请稍后再试';
        break;
      case 'auth/network-request-failed':
        errorMessage = '网络连接失败，请检查网络连接后重试';
        break;
      default:
        errorMessage = `登录失败: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
     throw error;
   }
}

// 显示邮箱已存在的对话框
function showEmailExistsDialog(email) {
  showNotification(`邮箱 ${email} 已被注册，已为您切换到登录模式`, 'info');
  
  // 切换到登录模式
  const loginTab = document.querySelector('.auth-switch .tab[data-tab="login"]');
  const registerTab = document.querySelector('.auth-switch .tab[data-tab="register"]');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (loginTab && registerTab && loginForm && registerForm) {
    // 切换标签状态
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    
    // 切换表单显示
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    
    // 预填邮箱
    const loginEmailInput = document.getElementById('loginEmail');
    if (loginEmailInput) {
      loginEmailInput.value = email;
      // 聚焦到密码输入框
      const loginPasswordInput = document.getElementById('loginPassword');
      if (loginPasswordInput) {
        loginPasswordInput.focus();
      }
    }
  }
}

// 显示邮箱验证提示对话框
function showEmailVerificationDialog(email) {
  showNotification(`验证邮件已发送到 ${email}，请查收邮件并点击验证链接。验证完成后即可正常登录。`, 'info');
  
  // 切换到登录模式
  const loginTab = document.querySelector('.auth-switch .tab[data-tab="login"]');
  const registerTab = document.querySelector('.auth-switch .tab[data-tab="register"]');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (loginTab && registerTab && loginForm && registerForm) {
    // 切换标签状态
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    
    // 切换表单显示
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    
    // 预填邮箱
    const loginEmailInput = document.getElementById('loginEmail');
    if (loginEmailInput) {
      loginEmailInput.value = email;
    }
  }
}

// 显示重新发送验证邮件的选项
function showResendVerificationOption(email, password) {
  // 创建重新发送按钮
  const resendButton = document.createElement('button');
  resendButton.textContent = '重新发送验证邮件';
  resendButton.className = 'btn btn-outline';
  resendButton.style.marginTop = '10px';
  
  // 添加点击事件
  resendButton.addEventListener('click', async () => {
    try {
      // 临时登录以发送验证邮件
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      
      showNotification('验证邮件已重新发送，请查收邮箱。', 'success');
      resendButton.remove();
    } catch (error) {
      console.error('重新发送验证邮件失败:', error);
      showNotification('重新发送验证邮件失败，请稍后重试。', 'error');
    }
  });
  
  // 将按钮添加到登录表单
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    // 移除之前的重新发送按钮（如果存在）
    const existingButton = loginForm.querySelector('.resend-verification-btn');
    if (existingButton) {
      existingButton.remove();
    }
    
    resendButton.classList.add('resend-verification-btn');
    loginForm.appendChild(resendButton);
  }
}

// 重新发送验证邮件
export async function resendEmailVerification(email, password) {
  try {
    // 临时登录以发送验证邮件
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    await signOut(auth);
    
    showNotification('验证邮件已重新发送，请查收邮箱。', 'success');
    return { success: true };
  } catch (error) {
    console.error('重新发送验证邮件失败:', error);
    
    let errorMessage = '重新发送验证邮件失败，请稍后重试';
    
    switch (error.code) {
      case 'auth/too-many-requests':
        errorMessage = '请求过于频繁，请稍后再试';
        break;
      case 'auth/user-not-found':
        errorMessage = '用户不存在';
        break;
      case 'auth/wrong-password':
        errorMessage = '密码错误';
        break;
      default:
        errorMessage = `重新发送失败: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
    return { success: false, error: errorMessage };
  }
}

// 邮箱密码注册
export async function signUpWithEmail(email, password, nickname) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('注册成功:', userCredential.user);
    
    // 保存用户昵称到Firestore
    try {
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        name: nickname || '',
        email: email,
        icon: '👤',
        isAdmin: false,
        disabled: false,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      console.log('用户昵称保存成功');
    } catch (profileError) {
      console.error('保存用户昵称失败:', profileError);
      // 即使保存昵称失败，也不影响注册流程
    }
    
    // 发送邮箱验证邮件
    try {
      await sendEmailVerification(userCredential.user);
      showNotification('注册成功！验证邮件已发送到您的邮箱，请查收并点击验证链接完成注册。', 'success');
      
      // 注册成功但需要验证邮箱，先登出用户
      await signOut(auth);
      
      // 显示验证提示
      showEmailVerificationDialog(email);
      
    } catch (verificationError) {
      console.error('发送验证邮件失败:', verificationError);
      showNotification('注册成功，但发送验证邮件失败。请稍后在登录后重新发送验证邮件。', 'warning');
    }
    
    return userCredential.user;
  } catch (error) {
    console.error('注册失败:', error);
    
    // 处理常见错误并提供友好提示
    let errorMessage = '注册失败，请稍后重试';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = '该邮箱已被注册，请使用其他邮箱或直接登录';
        // 显示切换到登录的提示
        showEmailExistsDialog(email);
        break;
      case 'auth/weak-password':
        errorMessage = '密码强度不够，请使用至少6位字符的密码';
        break;
      case 'auth/invalid-email':
        errorMessage = '邮箱格式不正确，请检查后重试';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = '邮箱注册功能暂时不可用';
        break;
      case 'auth/network-request-failed':
        errorMessage = '网络连接失败，请检查网络连接后重试';
        break;
      default:
        errorMessage = `注册失败: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
     throw error;
   }
}

// 匿名登录
export async function signInAnonymouslyUser() {
  try {
    const result = await signInAnonymously(auth);
    console.log('匿名登录成功:', result.user);
    
    // 清理localStorage中的用户配置，确保匿名用户不显示之前用户的信息
    localStorage.removeItem('userProfile');
    
    return { success: true, user: result.user };
  } catch (error) {
    console.error('匿名登录失败:', error);
    
    // 处理匿名登录错误
    let errorMessage = '匿名登录失败，请稍后重试';
    
    switch (error.code) {
      case 'auth/operation-not-allowed':
        errorMessage = '匿名登录功能未启用，请联系管理员';
        break;
      case 'auth/too-many-requests':
        errorMessage = '请求过于频繁，请稍后再试';
        break;
      default:
        errorMessage = `匿名登录失败: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
    return { success: false, error: errorMessage };
  }
}

// 忘记密码 - 发送重置邮件
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('密码重置邮件发送成功');
    return { success: true };
  } catch (error) {
    console.error('发送密码重置邮件失败:', error);
    
    let errorMessage = '发送重置邮件失败，请稍后重试';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = '该邮箱尚未注册，请检查邮箱地址';
        break;
      case 'auth/invalid-email':
        errorMessage = '邮箱格式不正确，请检查后重试';
        break;
      case 'auth/too-many-requests':
        errorMessage = '请求过于频繁，请稍后再试';
        break;
      default:
        errorMessage = `发送重置邮件失败: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
    return { success: false, error: errorMessage };
  }
}

// 登出
export async function signOutUser() {
  try {
    await signOut(auth);
    
    // 清理localStorage中的用户配置，确保下次登录时不会显示之前的用户信息
    localStorage.removeItem('userProfile');
    
    console.log('登出成功');
    return { success: true };
  } catch (error) {
    console.error('登出失败:', error);
    return { success: false, error: error.message };
  }
}

// 获取当前用户
export function getCurrentUser() {
  return currentUser;
}

// 检查用户是否已登录
export function isUserLoggedIn() {
  return currentUser !== null;
}

// 更新UI以反映认证状态
async function updateUIForAuthState(user) {
  const loginSection = document.getElementById('login-section');
  const userSection = document.getElementById('user-section');
  const userInfo = document.getElementById('user-info');
  const mainContent = document.querySelector('.content');
  const authModal = document.getElementById('auth-modal');
  
  if (user) {
    // 用户已登录
    if (loginSection) loginSection.style.display = 'none';
    if (userSection) userSection.style.display = 'block';
    if (mainContent) mainContent.style.display = 'block';
    if (authModal) {
      authModal.style.display = 'none';
      authModal.classList.remove('force-login');
      // 移除强制登录提示
      const notice = authModal.querySelector('.force-login-notice');
      if (notice) notice.remove();
    }
    
    // 初始化题库应用
    if (typeof window.initializeApp === 'function') {
      window.initializeApp();
    }
    
    if (userInfo) {
      // 异步获取用户设置的昵称和头像
      const userProfile = await getUserProfile();
      const displayName = userProfile.nickname || (user.isAnonymous ? '匿名用户' : (user.displayName || user.email));
      const avatar = userProfile.avatar || '👤';
      
      // 显示表情头像
      const avatarDisplay = `<span class="user-avatar">${avatar}</span>`;
      
      userInfo.innerHTML = `
        <span id="user-display" class="user-display">
          ${avatarDisplay}
          <span class="user-name">欢迎, ${displayName}</span>
        </span>
        <button id="logout-btn" class="btn btn-secondary">登出</button>
      `;
      
      // 添加用户信息点击事件（打开用户中心）
      const userDisplay = document.getElementById('user-display');
      if (userDisplay) {
        userDisplay.addEventListener('click', async () => {
          await showUserCenterModal();
        });
      }
      
      // 添加登出按钮事件
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          const result = await signOutUser();
          if (result.success) {
            showNotification('已成功登出', 'info');
          }
        });
      }
    }
  } else {
    // 用户未登录 - 强制显示登录界面
    if (loginSection) loginSection.style.display = 'block';
    if (userSection) userSection.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    
    // 强制显示登录模态框
    if (authModal) {
      authModal.style.display = 'block';
      // 确保显示登录表单
      showLoginForm();
    }
  }
}

// 显示登录表单
function showLoginForm() {
  const modal = document.getElementById('auth-modal');
  const modalTitle = document.getElementById('modal-title');
  const loginFormContainer = document.getElementById('login-form-container');
  const registerFormContainer = document.getElementById('register-form-container');
  const forgotPasswordContainer = document.getElementById('forgot-password-container');
  
  // 添加强制登录样式
  if (modal) modal.classList.add('force-login');
  
  if (modalTitle) modalTitle.textContent = '请先登录';
  if (loginFormContainer) {
    loginFormContainer.style.display = 'block';
    
    // 添加强制登录提示
    let notice = loginFormContainer.querySelector('.force-login-notice');
    if (!notice) {
      notice = document.createElement('div');
      notice.className = 'force-login-notice';
      notice.innerHTML = '🔒 您需要登录后才能使用题库复习系统';
      loginFormContainer.insertBefore(notice, loginFormContainer.firstChild);
    }
  }
  if (registerFormContainer) registerFormContainer.style.display = 'none';
  if (forgotPasswordContainer) forgotPasswordContainer.style.display = 'none';
}

// 显示通知消息
function showNotification(message, type = 'info') {
  // 移除现有通知
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // 创建新通知
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 显示动画
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // 3秒后自动隐藏
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

// 关闭登录模态框
function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// 初始化认证UI事件
export function initAuthUI() {
  // 登录表单事件
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      try {
        const user = await signInWithEmail(email, password);
        // 登录成功
        showNotification('登录成功！欢迎回来！', 'success');
        closeAuthModal();
        // 清空表单
        loginForm.reset();
      } catch (error) {
        // 错误已在 signInWithEmail 函数中处理
        console.log('登录失败，错误已处理');
      }
    });
  }
  
  // 注册表单事件
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nickname = document.getElementById('signup-nickname').value.trim();
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // 验证昵称
      if (!nickname) {
        showNotification('请输入昵称！', 'error');
        return;
      }
      
      if (nickname.length > 20) {
        showNotification('昵称不能超过20个字符！', 'error');
        return;
      }
      
      // 验证密码和确认密码是否匹配
      if (password !== confirmPassword) {
        showNotification('密码和确认密码不匹配！', 'error');
        return;
      }
      
      try {
        const user = await signUpWithEmail(email, password, nickname);
        // 注册成功，但需要验证邮箱，不关闭模态框
        // 成功消息已在 signUpWithEmail 函数中显示
        // 清空表单
        signupForm.reset();
      } catch (error) {
        // 错误已在 signUpWithEmail 函数中处理
        console.log('注册失败，错误已处理');
      }
    });
  }
  
  // 匿名登录按钮事件
  const anonymousLoginBtn = document.getElementById('anonymous-login-btn');
  if (anonymousLoginBtn) {
    anonymousLoginBtn.addEventListener('click', async () => {
      try {
        const result = await signInAnonymouslyUser();
        if (result.success) {
          // 匿名登录成功
          showNotification('匿名登录成功！欢迎使用！', 'success');
          closeAuthModal();
        }
      } catch (error) {
        // 错误已在 signInAnonymouslyUser 函数中处理
        console.log('匿名登录失败，错误已处理');
      }
    });
  }
  
  // 忘记密码表单事件
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('reset-email').value;
      
      if (!email) {
        showNotification('请输入邮箱地址', 'error');
        return;
      }
      
      try {
        const result = await resetPassword(email);
        if (result.success) {
          showNotification('密码重置邮件已发送，请查收邮箱', 'success');
          // 清空表单
          forgotPasswordForm.reset();
          // 可选：返回登录页面
          // showLoginForm();
        }
      } catch (error) {
        // 错误已在 resetPassword 函数中处理
        console.log('发送重置邮件失败，错误已处理');
      }
    });
  }
  
  // 初始化用户中心事件
  initUserCenterEvents();
}

// 用户配置文件管理
// 从 Firestore 获取用户配置
async function getUserProfile() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.isAnonymous) {
    // 匿名用户或未登录用户使用本地存储
    const profile = localStorage.getItem('userProfile');
    return profile ? JSON.parse(profile) : { nickname: '', avatar: '👤', isAdmin: false };
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        nickname: data.name || '',
        avatar: data.icon || '👤',
        isAdmin: data.isAdmin || data.isadmin || false
      };
    } else {
      // 用户文档不存在，返回默认值
      return { nickname: '', avatar: '👤', isAdmin: false };
    }
  } catch (error) {
    console.error('获取用户配置失败:', error);
    // 出错时使用本地存储作为备用
    const profile = localStorage.getItem('userProfile');
    return profile ? JSON.parse(profile) : { nickname: '', avatar: '👤', isAdmin: false };
  }
}

// 检查当前用户是否为管理员
export async function isCurrentUserAdmin() {
  const userProfile = await getUserProfile();
  return userProfile.isAdmin || false;
}

// 用户管理功能
// 获取所有用户列表
async function getAllUsers() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      console.error('非管理员用户无权访问用户列表');
      return { success: false, error: '权限不足' };
    }
    
    const usersQuery = query(collection(db, 'users'), orderBy('lastUpdated', 'desc'));
    const querySnapshot = await getDocs(usersQuery);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        email: userData.email || '',
        name: userData.name || '',
        icon: userData.icon || '👤',
        isAdmin: userData.isAdmin || userData.isadmin || false,
        disabled: userData.disabled || false,
        lastUpdated: userData.lastUpdated || '',
        createdAt: userData.createdAt || ''
      });
    });
    
    return { success: true, users };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return { success: false, error: error.message };
  }
}

// 停用/启用用户账号
async function toggleUserStatus(uid, disabled) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: '权限不足' };
    }
    
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      disabled: disabled,
      lastUpdated: new Date().toISOString()
    });
    
    return { 
      success: true, 
      message: disabled ? '用户账号已停用' : '用户账号已启用'
    };
  } catch (error) {
    console.error('更新用户状态失败:', error);
    return { success: false, error: error.message };
  }
}

// 删除用户账号
async function deleteUserAccount(uid) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: '权限不足' };
    }
    
    // 删除用户文档
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);
    
    return { 
      success: true, 
      message: '用户账号已删除'
    };
  } catch (error) {
    console.error('删除用户账号失败:', error);
    return { success: false, error: error.message };
  }
}

// 重置用户密码
async function resetUserPassword(email) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: '权限不足' };
    }
    
    // 发送密码重置邮件
    await sendPasswordResetEmail(auth, email);
    
    return { 
      success: true, 
      message: `密码重置邮件已发送至 ${email}`
    };
  } catch (error) {
    console.error('重置用户密码失败:', error);
    return { success: false, error: error.message };
  }
}

// 保存用户配置到 Firestore
async function saveUserProfile(profile) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.isAnonymous) {
    // 匿名用户或未登录用户使用本地存储
    localStorage.setItem('userProfile', JSON.stringify(profile));
    return { success: true };
  }
  
  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, {
      name: profile.nickname || '',
      icon: profile.avatar || '👤',
      email: currentUser.email,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    
    // 同时保存到本地存储作为备用
    localStorage.setItem('userProfile', JSON.stringify(profile));
    return { success: true };
  } catch (error) {
    console.error('保存用户配置失败:', error);
    // 出错时仍保存到本地存储
    localStorage.setItem('userProfile', JSON.stringify(profile));
    return { success: false, error: error.message };
  }
}



// 显示用户中心模态框
async function showUserCenterModal() {
  const modal = document.getElementById('user-center-modal');
  if (modal) {
    // 异步加载当前用户配置
    const userProfile = await getUserProfile();
    const nicknameInput = document.getElementById('user-nickname');
    if (nicknameInput) {
      nicknameInput.value = userProfile.nickname || '';
    }
    
    // 显示用户邮箱地址
    const emailInput = document.getElementById('user-email');
    const currentUser = getCurrentUser();
    if (emailInput) {
      if (currentUser && !currentUser.isAnonymous && currentUser.email) {
        emailInput.value = currentUser.email;
        emailInput.placeholder = '';
      } else if (currentUser && currentUser.isAnonymous) {
        emailInput.value = '';
        emailInput.placeholder = '匿名用户';
      } else {
        emailInput.value = '';
        emailInput.placeholder = '未登录';
      }
    }
    
    // 设置当前选中的头像
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
      option.classList.remove('selected');
      if (option.dataset.avatar === userProfile.avatar) {
        option.classList.add('selected');
      }
    });
    
    // 显示或隐藏管理员按钮
    const adminButton = document.getElementById('admin-user-management');
    if (adminButton) {
      adminButton.style.display = userProfile.isAdmin ? 'block' : 'none';
    }
    
    modal.style.display = 'block';
  }
}

// 隐藏用户中心模态框
function hideUserCenterModal() {
  const modal = document.getElementById('user-center-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// 显示用户管理模态框
async function showUserManagementModal() {
  const modal = document.getElementById('user-management-modal');
  if (!modal) return;
  
  // 检查是否为管理员
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    showNotification('您没有管理员权限', 'error');
    return;
  }
  
  // 显示模态框
  modal.style.display = 'block';
  
  // 加载用户列表
  await loadUserList();
}

// 隐藏用户管理模态框
function hideUserManagementModal() {
  const modal = document.getElementById('user-management-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// 加载用户列表
async function loadUserList() {
  const userListContainer = document.getElementById('user-list');
  if (!userListContainer) return;
  
  // 显示加载中
  userListContainer.innerHTML = '<div class="loading-text" style="text-align: center; padding: 40px; color: var(--text-light);">正在加载用户列表...</div>';
  
  // 获取用户列表
  const result = await getAllUsers();
  
  if (!result.success) {
    userListContainer.innerHTML = `<div class="error-text" style="text-align: center; padding: 40px; color: var(--error-color);">加载失败: ${result.error}</div>`;
    return;
  }
  
  const { users } = result;
  
  // 更新用户统计
  document.getElementById('total-users-count').textContent = `总用户数: ${users.length}`;
  document.getElementById('admin-users-count').textContent = `管理员: ${users.filter(user => user.isAdmin).length}`;
  
  // 如果没有用户
  if (users.length === 0) {
    userListContainer.innerHTML = '<div class="empty-text" style="text-align: center; padding: 40px; color: var(--text-light);">暂无用户数据</div>';
    return;
  }
  
  // 渲染用户列表
  renderUserList(users);
}

// 渲染用户列表
function renderUserList(users) {
  const userListContainer = document.getElementById('user-list');
  let html = '';
  
  users.forEach(user => {
    const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知';
    
    html += `
      <div class="user-item" data-uid="${user.uid}" style="display: grid; grid-template-columns: 60px 1fr 150px 100px 80px 200px; gap: 10px; padding: 15px 10px; border-bottom: 1px solid var(--border-color); align-items: center;">
        <div class="user-avatar" style="font-size: 24px; text-align: center;">${user.icon || '👤'}</div>
        <div class="user-info">
          <div class="user-name" style="font-weight: bold; color: var(--text-color);">${user.name || '未设置昵称'}</div>
          <div class="user-email" style="font-size: 13px; color: var(--text-light);">${user.email || '无邮箱'}</div>
        </div>
        <div class="user-date">${createdDate}</div>
        <div class="user-status" style="color: ${user.disabled ? 'var(--error-color)' : 'var(--success-color)'}">
          ${user.disabled ? '已停用' : '正常'}
        </div>
        <div class="user-role" style="color: ${user.isAdmin ? 'var(--warning-color)' : 'var(--text-light)'}">
          ${user.isAdmin ? '管理员' : '普通用户'}
        </div>
        <div class="user-actions">
          <button class="btn-sm ${user.disabled ? 'btn-success' : 'btn-warning'} toggle-status" data-uid="${user.uid}" data-disabled="${!user.disabled}" style="margin-right: 5px; padding: 4px 8px; font-size: 12px; border-radius: 3px; border: none; cursor: pointer;">
            ${user.disabled ? '启用' : '停用'}
          </button>
          <button class="btn-sm btn-info reset-password" data-uid="${user.uid}" data-email="${user.email}" style="margin-right: 5px; padding: 4px 8px; font-size: 12px; border-radius: 3px; border: none; cursor: pointer; background: #17a2b8; color: white;">
            重置密码
          </button>
          <button class="btn-sm btn-danger delete-user" data-uid="${user.uid}" data-name="${user.name || user.email || '未命名用户'}" style="padding: 4px 8px; font-size: 12px; border-radius: 3px; border: none; cursor: pointer; background: #dc3545; color: white;">
            删除
          </button>
        </div>
        
        <!-- 移动端卡片式布局 -->
        <div class="mobile-user-card" style="display: none;">
          <div class="mobile-user-header" style="display: flex; align-items: center; margin-bottom: 12px;">
            <span class="user-avatar" style="font-size: 28px; margin-right: 12px;">${user.icon || '👤'}</span>
            <div class="user-info" style="flex: 1;">
              <div class="user-name" style="font-weight: bold; color: var(--text-color); font-size: 16px;">${user.name || '未设置昵称'}</div>
              <div class="user-email" style="font-size: 14px; color: var(--text-light);">${user.email || '无邮箱'}</div>
            </div>
          </div>
          <div class="mobile-user-details" style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--text-light);">注册时间:</span>
              <span style="color: var(--text-color);">${createdDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--text-light);">账号状态:</span>
              <span style="color: ${user.disabled ? 'var(--error-color)' : 'var(--success-color)'}; font-weight: bold;">
                ${user.disabled ? '已停用' : '正常'}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-light);">用户角色:</span>
              <span style="color: ${user.isAdmin ? 'var(--warning-color)' : 'var(--text-light)'}; font-weight: bold;">
                ${user.isAdmin ? '管理员' : '普通用户'}
              </span>
            </div>
          </div>
          <div class="user-actions" style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn-sm ${user.disabled ? 'btn-success' : 'btn-warning'} toggle-status" data-uid="${user.uid}" data-disabled="${!user.disabled}" style="width: 100%; padding: 12px; font-size: 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600;">
              ${user.disabled ? '✅ 启用账号' : '⏸️ 停用账号'}
            </button>
            <button class="btn-sm btn-info reset-password" data-uid="${user.uid}" data-email="${user.email}" style="width: 100%; padding: 12px; font-size: 16px; border-radius: 6px; border: none; cursor: pointer; background: #17a2b8; color: white; font-weight: 600;">
              🔑 重置密码
            </button>
            <button class="btn-sm btn-danger delete-user" data-uid="${user.uid}" data-name="${user.name || user.email || '未命名用户'}" style="width: 100%; padding: 12px; font-size: 16px; border-radius: 6px; border: none; cursor: pointer; background: #dc3545; color: white; font-weight: 600;">
              🗑️ 删除用户
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  userListContainer.innerHTML = html;
  
  // 添加用户操作事件
  addUserActionEvents();
}

// 添加用户操作事件
function addUserActionEvents() {
  // 停用/启用按钮
  document.querySelectorAll('.toggle-status').forEach(button => {
    button.addEventListener('click', async (e) => {
      const uid = e.target.dataset.uid;
      const disabled = e.target.dataset.disabled === 'true';
      const userName = e.target.closest('.user-item').querySelector('.user-name').textContent;
      
      showUserActionConfirmation(
        `确定要${disabled ? '停用' : '启用'}用户 "${userName}" 的账号吗？`,
        async () => {
          const result = await toggleUserStatus(uid, disabled);
          if (result.success) {
            showNotification(result.message, 'success');
            await loadUserList(); // 重新加载用户列表
          } else {
            showNotification(`操作失败: ${result.error}`, 'error');
          }
        }
      );
    });
  });
  
  // 重置密码按钮
  document.querySelectorAll('.reset-password').forEach(button => {
    button.addEventListener('click', async (e) => {
      const email = e.target.dataset.email;
      if (!email) {
        showNotification('该用户没有关联邮箱，无法重置密码', 'error');
        return;
      }
      
      const userName = e.target.closest('.user-item').querySelector('.user-name').textContent;
      
      showUserActionConfirmation(
        `确定要为用户 "${userName}" 重置密码吗？重置链接将发送到邮箱 ${email}`,
        async () => {
          const result = await resetUserPassword(email);
          if (result.success) {
            showNotification(result.message, 'success');
          } else {
            showNotification(`重置密码失败: ${result.error}`, 'error');
          }
        }
      );
    });
  });
  
  // 删除用户按钮
  document.querySelectorAll('.delete-user').forEach(button => {
    button.addEventListener('click', (e) => {
      const uid = e.target.dataset.uid;
      const name = e.target.dataset.name;
      
      showUserActionConfirmation(
        `<div style="color: var(--error-color); font-weight: bold;">⚠️ 警告：此操作不可撤销</div><p>确定要删除用户 "${name}" 吗？</p>`,
        async () => {
          const result = await deleteUserAccount(uid);
          if (result.success) {
            showNotification(result.message, 'success');
            await loadUserList(); // 重新加载用户列表
          } else {
            showNotification(`删除失败: ${result.error}`, 'error');
          }
        }
      );
    });
  });
}

// 显示用户操作确认对话框
function showUserActionConfirmation(message, confirmCallback) {
  const modal = document.getElementById('user-action-modal');
  const content = document.getElementById('user-action-content');
  const confirmBtn = document.getElementById('confirm-user-action');
  const cancelBtn = document.getElementById('cancel-user-action');
  const closeBtn = document.getElementById('close-user-action');
  
  if (!modal || !content || !confirmBtn || !cancelBtn) return;
  
  // 设置内容
  content.innerHTML = message;
  
  // 显示模态框
  modal.style.display = 'block';
  
  // 清除之前的事件监听器
  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  const newCloseBtn = closeBtn.cloneNode(true);
  
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  
  // 确认按钮事件
  newConfirmBtn.addEventListener('click', async () => {
    modal.style.display = 'none';
    await confirmCallback();
  });
  
  // 取消按钮事件
  const cancelHandler = () => {
    modal.style.display = 'none';
  };
  
  newCancelBtn.addEventListener('click', cancelHandler);
  newCloseBtn.addEventListener('click', cancelHandler);
  
  // 点击模态框外部关闭
  const outsideClickHandler = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      modal.removeEventListener('click', outsideClickHandler);
    }
  };
  
  modal.addEventListener('click', outsideClickHandler);
}

// 初始化用户中心事件
function initUserCenterEvents() {
  // 关闭按钮事件
  const closeBtn = document.getElementById('close-user-center');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideUserCenterModal);
  }
  
  // 头像选择事件
  const avatarOptions = document.querySelectorAll('.avatar-option');
  avatarOptions.forEach(option => {
    option.addEventListener('click', () => {
      // 移除其他选中状态
      avatarOptions.forEach(opt => opt.classList.remove('selected'));
      // 添加当前选中状态
      option.classList.add('selected');
    });
  });
  
  // 用户管理按钮事件
  const adminBtn = document.getElementById('show-user-management');
  if (adminBtn) {
    adminBtn.addEventListener('click', async () => {
      // 隐藏用户中心模态框
      hideUserCenterModal();
      // 显示用户管理模态框
      await showUserManagementModal();
    });
  }
  
  // 用户管理模态框关闭按钮
  const closeUserManagementBtn = document.getElementById('close-user-management');
  if (closeUserManagementBtn) {
    closeUserManagementBtn.addEventListener('click', () => {
      hideUserManagementModal();
      // 重新显示用户中心模态框
      showUserCenterModal();
    });
  }
  
  // 用户管理底部关闭按钮
  const closeUserManagementBottomBtn = document.getElementById('close-user-management-btn');
  if (closeUserManagementBottomBtn) {
    closeUserManagementBottomBtn.addEventListener('click', () => {
      hideUserManagementModal();
      // 重新显示用户中心模态框
      showUserCenterModal();
    });
  }
  
  // 刷新用户列表按钮
  const refreshUsersBtn = document.getElementById('refresh-users');
  if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener('click', async () => {
      await loadUserList();
    });
  }
  
  // 用户搜索框
  const userSearchInput = document.getElementById('user-search');
  if (userSearchInput) {
    userSearchInput.addEventListener('input', () => {
      const searchTerm = userSearchInput.value.toLowerCase();
      const userItems = document.querySelectorAll('.user-item');
      
      userItems.forEach(item => {
        const userName = item.querySelector('.user-name').textContent.toLowerCase();
        const userEmail = item.querySelector('.user-email').textContent.toLowerCase();
        
        if (userName.includes(searchTerm) || userEmail.includes(searchTerm)) {
          item.style.display = 'grid';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
  
  // 保存按钮事件
  const saveBtn = document.getElementById('save-user-profile');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const nickname = document.getElementById('user-nickname').value.trim();
      const selectedAvatar = document.querySelector('.avatar-option.selected');
      
      let avatar = '👤';
      
      // 确定使用的头像
      if (selectedAvatar) {
        // 使用默认表情头像
        avatar = selectedAvatar.dataset.avatar;
      }
      
      // 验证昵称
      if (nickname && nickname.length > 20) {
        showNotification('昵称不能超过20个字符', 'error');
        return;
      }
      
      try {
        // 保存用户配置
        const userProfile = { nickname, avatar };
        const result = await saveUserProfile(userProfile);
        
        if (result.success) {
          // 更新UI显示
          const currentUser = getCurrentUser();
          if (currentUser) {
            await updateUIForAuthState(currentUser);
          }
          
          // 显示成功消息并关闭模态框
          showNotification('用户信息保存成功！', 'success');
          hideUserCenterModal();
        } else {
          showNotification(result.error || '保存失败，请重试', 'error');
        }
      } catch (error) {
        showNotification('保存失败，请重试', 'error');
        console.error('保存用户配置失败:', error);
      }
    });
  }
  
  // 取消按钮事件
  const cancelBtn = document.getElementById('cancel-user-profile');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', hideUserCenterModal);
  }
  
  // 点击模态框外部关闭
  const modal = document.getElementById('user-center-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideUserCenterModal();
      }
    });
  }
}

// 导出函数到window对象，供其他模块使用
window.authModule = {
  getUserProfile,
  getCurrentUser,
  isCurrentUserAdmin,
  saveUserProfile
};