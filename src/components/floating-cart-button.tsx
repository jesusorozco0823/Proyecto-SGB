"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FloatingCartButtonProps {
  itemCount: number;
  onClick: () => void;
}

export default function FloatingCartButton({ itemCount, onClick }: FloatingCartButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Posición inicial en la esquina inferior derecha
    const initialX = window.innerWidth - 80;
    const initialY = window.innerHeight - 80;
    setPosition({ x: initialX, y: initialY });
  }, []);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (buttonRef.current) {
      setIsDragging(true);
      setWasDragged(false);
      const rect = buttonRef.current.getBoundingClientRect();
      setOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>) => handleDragStart(e.clientX, e.clientY);
  const handleTouchStart = (e: TouchEvent<HTMLButtonElement>) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY);

  const handleDragMove = (clientX: number, clientY: number) => {
     if (isDragging) {
      setWasDragged(true);
      let newX = clientX - offset.x;
      let newY = clientY - offset.y;

      const maxX = window.innerWidth - (buttonRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (buttonRef.current?.offsetHeight || 0);

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: newX, y: newY });
    }
  }

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    e.preventDefault();
    handleDragMove(e.clientX, e.clientY);
  };
  
  const handleTouchMove = (e: globalThis.TouchEvent) => {
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
      if (!wasDragged) {
          onClick();
      }
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, offset]);

  return (
    <Button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
      className={cn(
        "z-50 h-16 w-16 rounded-full shadow-lg flex items-center justify-center relative cursor-grab",
        isDragging && "cursor-grabbing"
      )}
      size="icon"
    >
      <ShoppingCart className="h-8 w-8" />
      {itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 rounded-full px-2"
        >
          {itemCount}
        </Badge>
      )}
      <span className="sr-only">Ver carrito de compras</span>
    </Button>
  );
}
