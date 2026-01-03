import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

const useSocket = (tenantId) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!tenantId) return;

        const newSocket = io(`http://${window.location.hostname}:5000`);
        setSocket(newSocket);

        newSocket.emit('joinTenant', tenantId);

        return () => newSocket.close();
    }, [tenantId]);

    return socket;
};

export default useSocket;
