import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';

interface MindMapNodeData {
  label: string;
  category: string;
  description?: string;
  color: string;
}

const MindMapNode = memo(({ data }: NodeProps) => {
  const { label, category, description, color } = data as unknown as MindMapNodeData;

  const isRoot = category === 'root';

  return (
    <div className="mind-map-node">
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: color }}
      />
      
      <Card
        className="px-4 py-3 min-w-[180px] max-w-[250px] shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
        style={{
          borderLeft: `4px solid ${color}`,
          ...(isRoot && {
            background: `linear-gradient(135deg, ${color}15, ${color}05)`,
            borderWidth: '2px',
            borderColor: color,
          }),
        }}
      >
        <div className="space-y-1">
          <div
            className={`font-semibold ${isRoot ? 'text-lg' : 'text-sm'}`}
            style={{ color: isRoot ? color : 'inherit' }}
          >
            {label}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          <div className="text-xs font-medium" style={{ color }}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </div>
        </div>
      </Card>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: color }}
      />
    </div>
  );
});

MindMapNode.displayName = 'MindMapNode';

export default MindMapNode;