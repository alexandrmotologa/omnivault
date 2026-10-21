import React, { useRef, useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { ZoomIn, ZoomOut, RotateCcw, Search, Sparkles, Filter } from 'lucide-react';
import { Article } from '../../lib/db/types';

interface GraphNode {
  id: string;
  label: string;
  type: 'article' | 'tag' | 'domain';
  articleId?: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface KnowledgeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  onOpenArticle: (article: Article) => void;
}

export const KnowledgeGraphModal: React.FC<KnowledgeGraphModalProps> = ({
  isOpen,
  onClose,
  articles,
  onOpenArticle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Zoom & Pan state
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  // Nodes & Links state refs
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Build graph data on open
  useEffect(() => {
    if (!isOpen) return;

    const width = 800;
    const height = 550;
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // 1. Add Article Nodes
    articles.forEach((art) => {
      const artNode: GraphNode = {
        id: `art-${art.id}`,
        label: art.title,
        type: 'article',
        articleId: art.id,
        radius: Math.min(18, Math.max(10, 6 + Math.round(art.reading_time_minutes))),
        x: width / 2 + (Math.random() - 0.5) * 300,
        y: height / 2 + (Math.random() - 0.5) * 300,
        vx: 0,
        vy: 0,
        color: '#3b82f6', // blue
      };
      nodes.push(artNode);
      nodeMap.set(artNode.id, artNode);

      // 2. Add Domain Node & link
      if (art.site_name) {
        const domainId = `dom-${art.site_name}`;
        if (!nodeMap.has(domainId)) {
          const domNode: GraphNode = {
            id: domainId,
            label: art.site_name,
            type: 'domain',
            radius: 12,
            x: width / 2 + (Math.random() - 0.5) * 350,
            y: height / 2 + (Math.random() - 0.5) * 350,
            vx: 0,
            vy: 0,
            color: '#a855f7', // purple
          };
          nodes.push(domNode);
          nodeMap.set(domainId, domNode);
        }
        links.push({ source: artNode.id, target: domainId });
      }

      // 3. Add Tag Nodes & links
      art.tags.forEach((tag) => {
        const tagId = `tag-${tag}`;
        if (!nodeMap.has(tagId)) {
          const tagNode: GraphNode = {
            id: tagId,
            label: `#${tag}`,
            type: 'tag',
            radius: 9,
            x: width / 2 + (Math.random() - 0.5) * 350,
            y: height / 2 + (Math.random() - 0.5) * 350,
            vx: 0,
            vy: 0,
            color: '#10b981', // emerald
          };
          nodes.push(tagNode);
          nodeMap.set(tagId, tagNode);
        }
        links.push({ source: artNode.id, target: tagId });
      });
    });

    nodesRef.current = nodes;
    linksRef.current = links;
    transformRef.current = { x: 0, y: 0, scale: 1 };
  }, [isOpen, articles]);

  // Force-directed simulation loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    function tick() {
      if (!isRunning || !ctx || !canvas) return;

      const nodes = nodesRef.current;
      const links = linksRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Physics constants
      const repulsion = 1400;
      const springLength = 70;
      const springK = 0.05;
      const centerGravity = 0.02;
      const damping = 0.88;

      // 1. Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 260) {
            const force = repulsion / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (draggedNodeRef.current !== a) {
              a.vx -= fx;
              a.vy -= fy;
            }
            if (draggedNodeRef.current !== b) {
              b.vx += fx;
              b.vy += fy;
            }
          }
        }
      }

      // 2. Link attraction
      const nodeIndexMap = new Map<string, GraphNode>();
      nodes.forEach((n) => nodeIndexMap.set(n.id, n));

      links.forEach((l) => {
        const a = nodeIndexMap.get(l.source);
        const b = nodeIndexMap.get(l.target);
        if (a && b) {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const delta = dist - springLength;
          const fx = (dx / dist) * delta * springK;
          const fy = (dy / dist) * delta * springK;

          if (draggedNodeRef.current !== a) {
            a.vx += fx;
            a.vy += fy;
          }
          if (draggedNodeRef.current !== b) {
            b.vx -= fx;
            b.vy -= fy;
          }
        }
      });

      // 3. Center gravity & update positions
      nodes.forEach((n) => {
        if (draggedNodeRef.current !== n) {
          n.vx += (centerX - n.x) * centerGravity;
          n.vy += (centerY - n.y) * centerGravity;

          n.vx *= damping;
          n.vy *= damping;

          n.x += n.vx;
          n.y += n.vy;
        }
      });

      // 4. Render
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.scale, transformRef.current.scale);

      // Draw links
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(150, 150, 160, 0.22)';
      links.forEach((l) => {
        const a = nodeIndexMap.get(l.source);
        const b = nodeIndexMap.get(l.target);
        if (a && b) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      const filterLower = searchFilter.toLowerCase();

      nodes.forEach((n) => {
        const isMatched = !filterLower || n.label.toLowerCase().includes(filterLower);
        const isHovered = hoveredNode?.id === n.id;

        ctx.beginPath();
        ctx.arc(n.x, n.y, isHovered ? n.radius + 3 : n.radius, 0, Math.PI * 2);
        ctx.fillStyle = isMatched ? n.color : 'rgba(100, 100, 110, 0.3)';
        ctx.fill();

        if (isHovered || isMatched) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isHovered ? 2.5 : 1;
          ctx.stroke();
        }

        // Draw label
        if (n.radius >= 11 || isHovered || isMatched) {
          ctx.font = `${isHovered ? 'bold ' : ''}10px -apple-system, sans-serif`;
          ctx.fillStyle = isMatched ? '#ffffff' : 'rgba(150, 150, 160, 0.4)';
          ctx.textAlign = 'center';
          const truncated = n.label.length > 24 ? n.label.slice(0, 22) + '...' : n.label;
          ctx.fillText(truncated, n.x, n.y + n.radius + 12);
        }
      });

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(tick);
    }

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isOpen, searchFilter, hoveredNode]);

  // Coordinate helper: screen to world
  const toWorld = (screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - transformRef.current.x) / transformRef.current.scale;
    const y = (screenY - rect.top - transformRef.current.y) / transformRef.current.scale;
    return { x, y };
  };

  // Find node at world coordinate
  const getNodeAt = (worldX: number, worldY: number): GraphNode | null => {
    for (const n of nodesRef.current) {
      const dx = n.x - worldX;
      const dy = n.y - worldY;
      if (dx * dx + dy * dy <= (n.radius + 4) * (n.radius + 4)) {
        return n;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = toWorld(e.clientX, e.clientY);
    const clickedNode = getNodeAt(x, y);

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = toWorld(e.clientX, e.clientY);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
    } else if (isDraggingRef.current) {
      transformRef.current.x = e.clientX - dragStartRef.current.x;
      transformRef.current.y = e.clientY - dragStartRef.current.y;
    } else {
      const hit = getNodeAt(x, y);
      setHoveredNode(hit);
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    const { x, y } = toWorld(e.clientX, e.clientY);
    const node = getNodeAt(x, y);
    if (node && node.type === 'article' && node.articleId) {
      const art = articles.find((a) => a.id === node.articleId);
      if (art) {
        onOpenArticle(art);
        onClose();
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    transformRef.current.scale = Math.min(2.5, Math.max(0.4, transformRef.current.scale * zoomFactor));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Knowledge Graph View" maxWidth="max-w-4xl">
      <div className="space-y-3 text-xs">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter graph topics..."
                className="pl-8 pr-3 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] w-48 focus:outline-none"
              />
            </div>

            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Articles ({articles.length})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Tags
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Domains
              </span>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => (transformRef.current.scale = Math.min(2.5, transformRef.current.scale * 1.2))}
              className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => (transformRef.current.scale = Math.max(0.4, transformRef.current.scale * 0.8))}
              className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => (transformRef.current = { x: 0, y: 0, scale: 1 })}
              className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="relative border border-[var(--border-color)] rounded-xl overflow-hidden bg-[#121316]">
          <canvas
            ref={canvasRef}
            width={850}
            height={520}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            onWheel={handleWheel}
            className="w-full h-[360px] sm:h-[520px] cursor-grab active:cursor-grabbing block"
          />

          {/* Hover Tooltip Overlay */}
          {hoveredNode && (
            <div className="absolute bottom-3 left-3 p-2.5 rounded-lg bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] shadow-xl text-xs max-w-xs space-y-1 pointer-events-none animate-in fade-in duration-100">
              <div className="font-semibold text-[var(--text-primary)] leading-tight">
                {hoveredNode.label}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] capitalize flex items-center gap-1">
                <span>Type: {hoveredNode.type}</span>
                {hoveredNode.type === 'article' && <span>• Click node to read</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
