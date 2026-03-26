'use client';
import { useEffect, useRef } from 'react';

export function useDragScroll(scrollRef) {
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onMouseDown = (e) => {
      state.current.isDown = true;
      state.current.startX = e.pageX - el.offsetLeft;
      state.current.scrollLeft = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };

    const onMouseLeave = () => {
      state.current.isDown = false;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    };

    const onMouseUp = () => {
      state.current.isDown = false;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    };

    const onMouseMove = (e) => {
      if (!state.current.isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - state.current.startX) * 1.5;
      el.scrollLeft = state.current.scrollLeft - walk;
    };

    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, [scrollRef]);
}
