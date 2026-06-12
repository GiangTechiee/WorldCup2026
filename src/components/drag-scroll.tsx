"use client";

import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";

export function DragScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    isDragging: false,
    moved: false,
    scrollLeft: 0,
    startX: 0,
  });
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    dragState.current = {
      isDragging: true,
      moved: false,
      scrollLeft: container.scrollLeft,
      startX: event.clientX,
    };
    container.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || !dragState.current.isDragging) return;

    const delta = event.clientX - dragState.current.startX;
    if (Math.abs(delta) > 4) dragState.current.moved = true;
    container.scrollLeft = dragState.current.scrollLeft - delta;
  };

  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    dragState.current.isDragging = false;
    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!dragState.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dragState.current.moved = false;
  };

  return (
    <div
      className={`${className ?? ""}${dragging ? " is-dragging" : ""}`}
      onClickCapture={handleClickCapture}
      onPointerCancel={stopDragging}
      onPointerDown={handlePointerDown}
      onPointerLeave={stopDragging}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      ref={containerRef}
    >
      {children}
    </div>
  );
}
