import { useState, useEffect } from 'react';
import { User } from './types';
import { getUser } from './utils';
import { LoginPage } from './components/login/LoginPage';
import { HomePage } from './components/login/HomePage';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 检查本地存储的用户信息
  useEffect(() => {
    const savedUser = getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  // 登录成功回调
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  // 退出登录回调
  const handleLogout = () => {
    setUser(null);
  };

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-morandi-blue-50 via-morandi-beige-50 to-morandi-green-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // 已登录显示首页，否则显示登录页
  return user ? (
    <HomePage user={user} onLogout={handleLogout} />
  ) : (
    <LoginPage onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;
