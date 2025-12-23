import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Socket } from 'socket.io-client';

type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

interface ConnectionStatusProps {
  socket?: Socket | null;
}

export default function ConnectionStatus({ socket }: ConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionState>(
    socket?.connected ? 'connected' : 'disconnected'
  );
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!socket) {
      setStatus('disconnected');
      return;
    }
    
    // Update initial status
    setStatus(socket.connected ? 'connected' : 'disconnected');
    
    const onConnect = () => {
      setStatus('connected');
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const onDisconnect = () => {
      setStatus('disconnected');
      setShowBanner(true);
    };

    const onReconnectAttempt = () => {
      setStatus('reconnecting');
      setShowBanner(true);
    };

    const onReconnect = () => {
      setStatus('connected');
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('reconnect', onReconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('reconnect', onReconnect);
    };
  }, [socket]);

  const config = {
    connected: {
      icon: Wifi,
      color: 'text-green-400',
      bg: 'bg-green-500/20 border-green-500/50',
      text: 'Connected',
      pulse: false,
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-red-400',
      bg: 'bg-red-500/20 border-red-500/50',
      text: 'Disconnected',
      pulse: true,
    },
    reconnecting: {
      icon: RefreshCw,
      color: 'text-amber-400',
      bg: 'bg-amber-500/20 border-amber-500/50',
      text: 'Reconnecting...',
      pulse: true,
    },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <>
      {/* Fixed indicator dot in corner */}
      <div className="fixed bottom-4 right-4 z-50">
        <div 
          className={`flex items-center gap-2 px-3 py-2 rounded-full border ${current.bg} backdrop-blur-sm transition-all duration-300`}
          title={current.text}
        >
          <Icon 
            className={`w-4 h-4 ${current.color} ${current.pulse ? 'animate-pulse' : ''} ${status === 'reconnecting' ? 'animate-spin' : ''}`} 
          />
          <span className={`text-xs font-medium ${current.color}`}>
            {current.text}
          </span>
        </div>
      </div>

      {/* Banner notification for disconnection */}
      {showBanner && status === 'disconnected' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 text-center text-sm font-medium animate-pulse">
          ⚠️ Connection lost. Attempting to reconnect...
        </div>
      )}
    </>
  );
}
