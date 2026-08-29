import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { useUnreadCount } from '../../src/api/hooks';
import { useAuth } from '../../src/lib/AuthProvider';
import { colors, fontSize } from '../../src/theme';

/**
 * 역할별 탭 구성.
 * expo-router의 Tabs는 파일 기준으로 화면을 모두 등록하므로,
 * 해당 역할에 없는 탭은 href를 null로 두어 탭바에서 감춘다.
 */
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{label}</Text>
  );
}

export default function AppTabsLayout() {
  const { user } = useAuth();
  const { data: unread } = useUnreadCount();

  const isMember = user?.role === 'MEMBER';
  const isTrainer = user?.role === 'TRAINER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const badge = unread?.count && unread.count > 0 ? unread.count : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '600' },
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
          tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="reservations"
        options={{
          title: '내 예약',
          href: isMember ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon label="🗓" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="memberships"
        options={{
          title: '이용권',
          href: isMember ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon label="🎟" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="classes"
        options={{
          title: '내 수업',
          href: isTrainer ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon label="📋" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="manage"
        options={{
          title: '운영',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: '알림',
          tabBarBadge: badge,
          tabBarIcon: ({ focused }) => <TabIcon label="🔔" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: '내 정보',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
