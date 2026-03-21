'use client';
import { useState, useEffect, useCallback } from 'react';

let _showToast = () => {};

/** Call from anywhere: showToast('message') */
export function showToast(msg, duration = 3000) {
  _showToast(msg, duration);
}

/** Mount this once in the layout */
export default function Toast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  const show = useCallback((msg, duration) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), duration);
  }, []);

  useEffect(() => {
    _showToast = show;
    return () => { _showToast = () => {}; };
  }, [show]);

  return (
    <div className={`toast${visible ? ' show' : ''}`}>
      {message}
    </div>
  );
}
