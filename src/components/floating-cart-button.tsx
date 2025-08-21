"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FloatingCartButtonProps {
  itemCount: number;
}

export default function FloatingCartButton({ itemCount }: FloatingCartButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Posición inicial en la esquina inferior derecha
    const initialX = window.innerWidth - 80;
    const initialY = window.innerHeight - 80;
    setPosition({ x: initialX, y: initialY });
  }, []);

  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      setIsDragging(true);
      const rect = buttonRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
        setIsDragging(true);
        const touch = e.touches[0];
        const rect = buttonRef.current.getBoundingClientRect();
        setOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        });
    }
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      let newX = e.clientX - offset.x;
      let newY = e.clientY - offset.y;

      // Limitar al viewport
      const maxX = window.innerWidth - (buttonRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (buttonRef.current?.offsetHeight || 0);

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: newX, y: newY });
    }
  };
  
  const handleTouchMove = (e: globalThis.TouchEvent) => {
    if (isDragging) {
        const touch = e.touches[0];
        let newX = touch.clientX - offset.x;
        let newY = touch.clientY - offset.y;

        const maxX = window.innerWidth - (buttonRef.current?.offsetWidth || 0);
        const maxY = window.innerHeight - (buttonRef.current?.offsetHeight || 0);

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, offset]);

  return (
    <Button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
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
