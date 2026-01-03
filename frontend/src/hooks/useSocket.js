import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

const useSocket = (tenantId) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!tenantId) return;

        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || `http://${window.location.hostname}:5000`;
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        newSocket.emit('joinTenant', tenantId);

        return () => newSocket.close();
    }, [tenantId]);

    return socket;
};

export default useSocket;
