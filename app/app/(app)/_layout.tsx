import { Tabs } from 'expo-router';
import React from 'react';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUnreadCount } from '../../src/api/hooks';
import { Icon, type IconName } from '../../src/components/Icon';
import { Logo } from '../../src/components/Logo';
import { useAuth } from '../../src/lib/AuthProvider';
import { colors, fontSize } from '../../src/theme';

/**
 * 역할별 탭 구성.
 * expo-router의 Tabs는 파일 기준으로 화면을 모두 등록하므로,
 * 해당 역할에 없는 탭은 href를 null로 두어 탭바에서 감춘다.
 */
/** 선택된 탭은 채운 형태로 그려 상태를 분명히 한다. */
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <Icon
      name={name}
      size={21}
      filled={focused}
      color={focused ? colors.primary : colors.textFaint}
    />
  );
}

export default function AppTabsLayout() {
  const { user } = useAuth();
  const { data: unread } = useUnreadCount();
  // 아이콘이 커져 기본 높이로는 라벨이 잘린다. 홈 인디케이터 여백까지 더해 계산한다.
  const insets = useSafeAreaInsets();

  const isMember = user?.role === 'MEMBER';
  const isTrainer = user?.role === 'TRAINER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const badge = unread?.count && unread.count > 0 ? unread.count : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 74 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 12,
        },
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '600' },
        tabBarIconStyle: { marginBottom: 1 },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '700' },
        headerTintColor: colors.primary,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          // 홈에서는 제목 대신 브랜드 마크를 보여준다.
          headerTitle: () => <Logo size={26} />,
          headerTitleAlign: 'left',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="reservations"
        options={{
          title: '내 예약',
          href: isMember ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="calendar" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="memberships"
        options={{
          title: '이용권',
          href: isMember ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="ticket" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="classes"
        options={{
          title: '내 수업',
          href: isTrainer ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="clipboard" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="manage"
        options={{
          title: '운영',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="sliders" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: '알림',
          tabBarBadge: badge,
          tabBarIcon: ({ focused }) => <TabIcon name="bell" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: '내 정보',
          tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
