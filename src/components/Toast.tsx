
import React, { useEffect } from 'react';

const styles = {
    toast: {
        position: 'fixed' as 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        zIndex: 2000,
        fontSize: '0.8rem',
        border: '2px solid white',
    },
};

interface ToastProps {
    message: string;
    onDismiss: () => void;
}

const Toast = ({ message, onDismiss }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return <div style={styles.toast}>{message}</div>;
};

export default Toast;
