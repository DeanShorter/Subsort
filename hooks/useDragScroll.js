'use client';
import { useEffect, useRef } from 'react';

export function useDragScroll(scrollRef) {
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0, dragged: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onMouseDown = (e) => {
      state.current.isDown = true;
      state.current.dragged = false;
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
      const walk = x - state.current.startX;
      if (Math.abs(walk) > 3) state.current.dragged = true;
      el.scrollLeft = state.current.scrollLeft - walk * 1.5;
    };

    // Prevent pill clicks from firing if user was dragging
    const onClick = (e) => {
      if (state.current.dragged) {
        e.preventDefault();
        e.stopPropagation();
        state.current.dragged = false;
      }
    };

    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('click', onClick, true);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('click', onClick, true);
    };
  }, [scrollRef]);
}
