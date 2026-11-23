import React from 'react';
import { useLocation } from 'wouter';
import { BarChart3, Library, Compass, ArrowLeft } from 'lucide-react';
import { EmptyState, Button } from '../../design/components';

export const StatsPlaceholderScreen: React.FC = () => {
  const [, navigate] = useLocation();
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Thống kê & Tiến độ Band
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
          Biểu đồ Band 4 kỹ năng theo thời gian, Heatmap 26 tuần và phân tích bẫy hay sai.
        </p>
      </div>
      <EmptyState
        icon={<BarChart3 className="w-7 h-7" />}
        title="Chưa có dữ liệu phiên học"
        description="Sau khi bạn hoàn thành các phiên luyện đầu tiên, biểu đồ Band ước lượng, dự báo thẻ ôn 7 ngày tới và top lỗi thường gặp sẽ hiển thị tại đây."
        action={
          <Button variant="primary" onClick={() => navigate('/hub')}>
            Bắt đầu phiên luyện đầu tiên
          </Button>
        }
      />
    </div>
  );
};

export const LibraryPlaceholderScreen: React.FC = () => {
  const [, navigate] = useLocation();
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Thư viện Từ vựng & Portfolio
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
          Tra cứu 2.000+ từ vựng học thuật, collocation, paraphrase và hồ sơ bài viết Writing / ghi âm Speaking.
        </p>
      </div>
      <EmptyState
        icon={<Library className="w-7 h-7" />}
        title="Thư viện đang sẵn sàng đồng bộ"
        description="Các thẻ từ vựng bạn đã học trong V1–V3 cùng bài viết W1 và bản thu S1 sẽ được lưu trữ và tra cứu nhanh tại đây."
        action={
          <Button variant="primary" onClick={() => navigate('/hub')}>
            Mở Hub 12 chế độ
          </Button>
        }
      />
    </div>
  );
};

export const PlacementPlaceholderScreen: React.FC = () => {
  const [, navigate] = useLocation();
  return (
    <div className="space-y-6 pb-8">
      <EmptyState
        icon={<Compass className="w-7 h-7" />}
        title="Bài kiểm tra định vị đầu vào (Placement ~25 phút)"
        description="Gồm 20 câu từ vựng/collocation theo dải tần suất, 1 mini-section Listening, 1 đoạn Reading TFNG và 1 câu tự đánh giá Writing/Speaking. Sắp mở ở mốc tiếp theo."
        action={
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/')}
          >
            Quay về Hôm nay
          </Button>
        }
      />
    </div>
  );
};
