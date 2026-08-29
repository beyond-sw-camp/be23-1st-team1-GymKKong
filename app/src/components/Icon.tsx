import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../theme';

/**
 * 아이콘 세트.
 *
 * 24x24 그리드에 스트로크(1.8) 기준으로 직접 그렸다. 이모지를 쓰면 플랫폼마다
 * 모양·굵기·기준선이 달라지고 색을 맞출 수 없어서 전부 벡터로 대체했다.
 *
 * `filled`는 탭바 선택 상태처럼 강조가 필요한 곳에서만 쓴다.
 */
export type IconName =
  | 'home'
  | 'calendar'
  | 'ticket'
  | 'clipboard'
  | 'sliders'
  | 'bell'
  | 'user'
  | 'star'
  | 'check-circle'
  | 'alert-triangle'
  | 'clock'
  | 'card'
  | 'message'
  | 'megaphone'
  | 'pin'
  | 'chevron-right';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  /** 채운 형태로 그린다. 탭 선택 상태 등. */
  filled?: boolean;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 24,
  color = colors.text,
  filled = false,
  strokeWidth = 1.8,
}: Props) {
  const stroke = filled ? 'none' : color;
  const fill = filled ? color : 'none';
  const common = {
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {renderPaths(name, common, color, filled, strokeWidth)}
    </Svg>
  );
}

function renderPaths(
  name: IconName,
  p: {
    stroke: string;
    strokeWidth: number;
    strokeLinecap: 'round';
    strokeLinejoin: 'round';
    fill: string;
  },
  color: string,
  filled: boolean,
  sw: number,
) {
  // 선으로만 그리는 보조 획(집·달력의 내부선 등)은 채움 상태에서도 색을 반전해 보이게 한다.
  const inner = filled ? colors.surface : color;

  switch (name) {
    case 'home':
      return (
        <>
          <Path {...p} d="M3.4 10.8 12 3.7l8.6 7.1V19a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2z" />
          <Path
            d="M9.4 21v-6.2h5.2V21"
            stroke={inner}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      );

    case 'calendar':
      return (
        <>
          <Path {...p} d="M3.8 7.4A2.6 2.6 0 0 1 6.4 4.8h11.2a2.6 2.6 0 0 1 2.6 2.6v10.2a2.6 2.6 0 0 1-2.6 2.6H6.4a2.6 2.6 0 0 1-2.6-2.6z" />
          <Path
            d="M8 2.8v4M16 2.8v4M3.8 10.2h16.4"
            stroke={filled ? colors.surface : color}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
        </>
      );

    case 'ticket':
      return (
        <>
          <Path
            {...p}
            d="M3 9.4V7.2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.2a2.7 2.7 0 0 0 0 5.2v2.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.2a2.7 2.7 0 0 0 0-5.2Z"
          />
          <Path
            d="M14.4 6.4v2.2M14.4 11v2M14.4 15.4v2.2"
            stroke={inner}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
        </>
      );

    case 'clipboard':
      return (
        <>
          <Path
            {...p}
            d="M9 4.6H7.2a2 2 0 0 0-2 2v12.2a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V6.6a2 2 0 0 0-2-2H15"
          />
          <Path
            {...p}
            d="M9.6 3h4.8a1 1 0 0 1 1 1v1.8a1 1 0 0 1-1 1H9.6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
          />
          <Path
            d="M8.8 11.6h6.4M8.8 15.6h4.2"
            stroke={inner}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
        </>
      );

    case 'sliders':
      return (
        <>
          <Path
            d="M3.4 7.4h3.4M11 7.4h9.6M3.4 12h9.6M17.2 12h3.4M3.4 16.6h3.4M11 16.6h9.6"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx="8.9" cy="7.4" r="2.1" stroke={color} strokeWidth={sw} fill={filled ? color : colors.surface} />
          <Circle cx="15.1" cy="12" r="2.1" stroke={color} strokeWidth={sw} fill={filled ? color : colors.surface} />
          <Circle cx="8.9" cy="16.6" r="2.1" stroke={color} strokeWidth={sw} fill={filled ? color : colors.surface} />
        </>
      );

    case 'bell':
      return (
        <>
          <Path
            {...p}
            d="M18.4 9.2a6.4 6.4 0 1 0-12.8 0c0 5-2.2 6.6-2.2 6.6h17.2s-2.2-1.6-2.2-6.6Z"
          />
          <Path
            d="M10.2 19a2.1 2.1 0 0 0 3.6 0"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
        </>
      );

    case 'user':
      return (
        <>
          <Circle cx="12" cy="8.1" r="3.9" {...p} />
          <Path {...p} d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0" />
        </>
      );

    case 'star':
      return (
        <Path
          {...p}
          d="m12 3.4 2.68 5.43 5.99.87-4.34 4.23 1.03 5.97L12 17.08l-5.36 2.82 1.03-5.97L3.33 9.7l5.99-.87z"
        />
      );

    case 'check-circle':
      return (
        <>
          <Circle cx="12" cy="12" r="8.6" {...p} />
          <Path
            d="m8.3 12.2 2.6 2.6 4.8-5.2"
            stroke={inner}
            strokeWidth={sw + 0.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      );

    case 'alert-triangle':
      return (
        <>
          <Path
            {...p}
            d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"
          />
          <Path
            d="M12 9.4v4M12 16.8h.01"
            stroke={inner}
            strokeWidth={sw + 0.2}
            strokeLinecap="round"
            fill="none"
          />
        </>
      );

    case 'clock':
      return (
        <>
          <Circle cx="12" cy="12" r="8.6" {...p} />
          <Path
            d="M12 7.2V12l3.2 1.9"
            stroke={inner}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      );

    case 'card':
      return (
        <>
          <Path {...p} d="M3 8.2a2.4 2.4 0 0 1 2.4-2.4h13.2A2.4 2.4 0 0 1 21 8.2v7.6a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 15.8z" />
          <Path
            d="M3 10.6h18M6.6 14.6h3.2"
            stroke={inner}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
        </>
      );

    case 'message':
      return (
        <Path
          {...p}
          d="M20.4 12.6a7.4 7.4 0 0 1-7.9 7.4c-.7 0-1.4-.1-2-.3L4.2 21l1.4-4.1a7.4 7.4 0 1 1 14.8-4.3Z"
        />
      );

    case 'megaphone':
      return (
        <>
          <Path {...p} d="M3.4 10.2a2.6 2.6 0 0 1 2.6-2.6h2.6L17 4v13l-8.4-3.6H6a2.6 2.6 0 0 1-2.6-2.6z" />
          <Path
            d="M20 9.2a3.2 3.2 0 0 1 0 5.6M7.6 14v4.6a1.6 1.6 0 0 0 3.2 0v-3.6"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
        </>
      );

    case 'pin':
      return (
        <Path
          {...p}
          d="M9 3.4h6a1 1 0 0 1 .8 1.6l-.9 1.2v3.3l2.4 2.9a1 1 0 0 1-.8 1.6h-3.7v4.6l-.8 1.7-.8-1.7v-4.6H7.5a1 1 0 0 1-.8-1.6l2.4-2.9V6.2l-.9-1.2A1 1 0 0 1 9 3.4Z"
        />
      );

    case 'chevron-right':
      return (
        <Path
          d="m9.4 5.6 6.4 6.4-6.4 6.4"
          stroke={color}
          strokeWidth={sw + 0.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );

    default:
      return null;
  }
}
