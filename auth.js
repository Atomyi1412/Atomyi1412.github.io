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
  updateDoc
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
export async function signUpWithEmail(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('注册成功:', userCredential.user);
    
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
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // 验证密码和确认密码是否匹配
      if (password !== confirmPassword) {
        showNotification('密码和确认密码不匹配！', 'error');
        return;
      }
      
      try {
        const user = await signUpWithEmail(email, password);
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
    return profile ? JSON.parse(profile) : { nickname: '', avatar: '👤' };
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        nickname: data.name || '',
        avatar: data.icon || '👤'
      };
    } else {
      // 用户文档不存在，返回默认值
      return { nickname: '', avatar: '👤' };
    }
  } catch (error) {
    console.error('获取用户配置失败:', error);
    // 出错时使用本地存储作为备用
    const profile = localStorage.getItem('userProfile');
    return profile ? JSON.parse(profile) : { nickname: '', avatar: '👤' };
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