// Firebase 生产环境配置文件
// 此文件用于腾讯云等生产环境部署
// 通过环境变量来设置 Firebase 敏感配置信息

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 浏览器环境兼容的环境变量获取函数
function getFirebaseEnvVar(name, defaultValue = '') {
    // 从 window 对象获取（容器运行时注入）
    if (typeof window !== 'undefined' && window[name]) {
        return window[name];
    }
    // 返回默认值
    return defaultValue;
}

// 生产环境 Firebase 配置
// 从环境变量获取敏感信息，确保安全性
const firebaseConfig = {
  apiKey: getFirebaseEnvVar('FIREBASE_API_KEY', ''),
  authDomain: getFirebaseEnvVar('FIREBASE_AUTH_DOMAIN', ''),
  projectId: getFirebaseEnvVar('FIREBASE_PROJECT_ID', ''),
  storageBucket: getFirebaseEnvVar('FIREBASE_STORAGE_BUCKET', ''),
  messagingSenderId: getFirebaseEnvVar('FIREBASE_MESSAGING_SENDER_ID', ''),
  appId: getFirebaseEnvVar('FIREBASE_APP_ID', ''),
  measurementId: getFirebaseEnvVar('FIREBASE_MEASUREMENT_ID', '')
};

// 配置验证函数
function validateFirebaseConfig() {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('Firebase 配置缺失以下字段:', missingFields);
    console.error('请确保在环境变量或 window 对象中设置了这些值');
    return false;
  }
  
  return true;
}

// 验证配置
if (!validateFirebaseConfig()) {
  console.warn('Firebase 配置不完整，某些功能可能无法正常使用');
}

let app, analytics, auth, db;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // 只在有效配置下初始化服务
  if (firebaseConfig.apiKey) {
    auth = getAuth(app);
    db = getFirestore(app);
    
    // 只在有 measurementId 时初始化 Analytics
    if (firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
  }
  
  console.log('Firebase 初始化成功');
} catch (error) {
  console.error('Firebase 初始化失败:', error);
  
  // 创建空的服务对象以避免应用崩溃
  auth = null;
  db = null;
  analytics = null;
}

export { app, analytics, auth, db, validateFirebaseConfig };