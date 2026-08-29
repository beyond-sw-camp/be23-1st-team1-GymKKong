import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '../../src/api/client';
import {
  useCancelSession,
  useCreateProgram,
  useCreateSession,
  usePlaceRooms,
  useTrainerPlaces,
  useTrainerPrograms,
  useTrainerSessions,
} from '../../src/api/hooks';
import type { ClassType, MyPlace, Program } from '../../src/api/types';
import { useConfirm } from '../../src/components/ConfirmProvider';
import { ChoiceGroup, FormSheet } from '../../src/components/FormSheet';
import { SessionCard } from '../../src/components/SessionCard';
import { Badge, Button, EmptyState, ErrorState, Field, Loading } from '../../src/components/ui';
import { formatDate, toDateParam } from '../../src/lib/format';
import { colors, fontSize, radius, shadow, spacing, statusLabel } from '../../src/theme';

type Tab = 'SESSIONS' | 'PROGRAMS' | 'PLACES';

/** 트레이너 전용 화면. 내 회차 / 강습 개설 / 소속 지점. */
export default function TrainerClassesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('SESSIONS');

  const today = toDateParam(new Date());
  const sessions = useTrainerSessions(today, 14, tab === 'SESSIONS');
  const programs = useTrainerPrograms(tab === 'PROGRAMS');
  const places = useTrainerPlaces();

  const cancelSession = useCancelSession();
  const { confirm, notice } = useConfirm();

  // 승인된(ACTIVE) 지점에서만 강습을 개설할 수 있다.
  const activePlaces = useMemo(
    () => (places.data ?? []).filter((p) => p.status === 'ACTIVE'),
    [places.data],
  );

  const [programForm, setProgramForm] = useState(false);
  const [sessionForm, setSessionForm] = useState<Program | null>(null);

  const confirmCancelSession = async (sessionId: number, name: string) => {
    const ok = await confirm({
      title: '수업을 취소할까요?',
      message: `${name}\n\n예약한 회원 전원에게 알림이 가고, 이용권이 모두 복원됩니다.`,
      confirmText: '수업 취소',
      destructive: true,
    });
    if (!ok) return;
    cancelSession.mutate(
      { sessionId },
      {
        onSuccess: (data) =>
          void notice({
            title: '취소 완료',
            message: `${data.canceledReservations}건의 예약이 취소되고 이용권이 복원되었습니다.`,
          }),
        onError: (e) => void notice({ title: '취소 실패', message: errorMessage(e) }),
      },
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(
          [
            ['SESSIONS', '수업 일정'],
            ['PROGRAMS', '내 강습'],
            ['PLACES', '소속 지점'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.tabActive]}
            testID={`tab-${key}`}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'SESSIONS' && (
        <FlatList
          data={sessions.data ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={sessions.isFetching} onRefresh={() => sessions.refetch()} />
          }
          ListEmptyComponent={
            sessions.isLoading ? (
              <Loading />
            ) : sessions.isError ? (
              <ErrorState message={errorMessage(sessions.error)} onRetry={() => sessions.refetch()} />
            ) : (
              <EmptyState
                title="예정된 수업이 없어요"
                description="내 강습 탭에서 강습을 만들고 회차를 개설하세요."
                action={<Button title="내 강습으로" small onPress={() => setTab('PROGRAMS')} />}
              />
            )
          }
          renderItem={({ item }) => (
            <View>
              <Text style={styles.dateHeader}>{formatDate(item.startAt)}</Text>
              <SessionCard
                session={item}
                variant="trainer"
                onPress={() => router.push(`/roster/${item.id}`)}
              />
              {item.status === 'SCHEDULED' && (
                <View style={styles.rowActions}>
                  <Button
                    title="출석 관리"
                    small
                    onPress={() => router.push(`/roster/${item.id}`)}
                  />
                  <Button
                    title="수업 취소"
                    variant="secondary"
                    small
                    onPress={() => confirmCancelSession(item.id, item.programName)}
                  />
                </View>
              )}
            </View>
          )}
        />
      )}

      {tab === 'PROGRAMS' && (
        <>
          <FlatList
            data={programs.data ?? []}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={programs.isFetching} onRefresh={() => programs.refetch()} />
            }
            ListEmptyComponent={
              programs.isLoading ? (
                <Loading />
              ) : (
                <EmptyState
                  title="개설한 강습이 없어요"
                  description={
                    activePlaces.length === 0
                      ? '먼저 소속 지점 탭에서 지점 승인을 받아야 합니다.'
                      : '아래 버튼으로 강습을 만들어보세요.'
                  }
                />
              )
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Badge value={item.classType} />
                </View>
                <Text style={styles.meta}>
                  {item.placeName} · {statusLabel[item.level]} · {item.durationMin}분 · 정원{' '}
                  {item.defaultCapacity}명
                </Text>
                {!!item.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.rowActions}>
                  <Button title="회차 개설" small onPress={() => setSessionForm(item)} />
                </View>
              </View>
            )}
          />

          <View style={styles.footer}>
            <Button
              title="강습 개설"
              disabled={activePlaces.length === 0}
              onPress={() => setProgramForm(true)}
            />
            {activePlaces.length === 0 && (
              <Text style={styles.footerNote}>승인된 소속 지점이 있어야 개설할 수 있습니다.</Text>
            )}
          </View>
        </>
      )}

      {tab === 'PLACES' && (
        <FlatList
          data={places.data ?? []}
          keyExtractor={(item) => String(item.placeId)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={places.isFetching} onRefresh={() => places.refetch()} />
          }
          ListEmptyComponent={
            places.isLoading ? (
              <Loading />
            ) : (
              <EmptyState
                title="소속 지점이 없어요"
                description="홈에서 지점을 열어 소속을 신청하면 관리자 승인 후 활동할 수 있습니다."
              />
            )
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/place/${item.placeId}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.placeName}</Text>
                <Badge value={item.status} />
              </View>
              <Text style={styles.meta}>{item.address}</Text>
              {item.status === 'PENDING' && (
                <Text style={styles.pendingNote}>관리자 승인을 기다리는 중입니다.</Text>
              )}
            </Pressable>
          )}
        />
      )}

      <ProgramFormSheet
        visible={programForm}
        places={activePlaces}
        onClose={() => setProgramForm(false)}
        onCreated={() => {
          setProgramForm(false);
          void programs.refetch();
        }}
      />

      <SessionFormSheet
        program={sessionForm}
        onClose={() => setSessionForm(null)}
        onCreated={() => {
          setSessionForm(null);
          void sessions.refetch();
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------- 강습 개설

function ProgramFormSheet({
  visible,
  places,
  onClose,
  onCreated,
}: {
  visible: boolean;
  places: MyPlace[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const create = useCreateProgram();
  const [placeId, setPlaceId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [classType, setClassType] = useState<ClassType>('GROUP');
  const [durationMin, setDurationMin] = useState('60');
  const [capacity, setCapacity] = useState('10');
  const [error, setError] = useState<string | null>(null);

  const effectivePlaceId = placeId ?? places[0]?.placeId ?? null;

  const submit = () => {
    if (!effectivePlaceId) return setError('지점을 선택해주세요.');
    if (!name.trim()) return setError('강습명을 입력해주세요.');
    const duration = Number(durationMin);
    const cap = Number(capacity);
    if (!Number.isFinite(duration) || duration < 10 || duration > 300) {
      return setError('소요 시간은 10~300분 사이여야 합니다.');
    }
    if (!Number.isFinite(cap) || cap < 1 || cap > 100) {
      return setError('정원은 1~100명 사이여야 합니다.');
    }

    setError(null);
    create.mutate(
      {
        placeId: effectivePlaceId,
        name: name.trim(),
        description: description.trim() || undefined,
        classType,
        durationMin: duration,
        defaultCapacity: cap,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          onCreated();
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <FormSheet
      visible={visible}
      title="강습 개설"
      description="강습을 만든 뒤 회차를 열면 회원이 예약할 수 있습니다."
      submitText="개설"
      submitting={create.isPending}
      error={error}
      onSubmit={submit}
      onClose={onClose}
    >
      {places.length > 1 && (
        <ChoiceGroup
          label="지점"
          value={effectivePlaceId}
          options={places.map((p) => ({ value: p.placeId, label: p.placeName }))}
          onChange={setPlaceId}
        />
      )}
      <Field label="강습명" value={name} onChangeText={setName} placeholder="아침 요가" />
      <Field
        label="설명 (선택)"
        value={description}
        onChangeText={setDescription}
        placeholder="하루를 여는 60분 빈야사 요가."
        multiline
      />
      <ChoiceGroup
        label="수업 종류"
        value={classType}
        options={[
          { value: 'GROUP' as ClassType, label: '그룹' },
          { value: 'PERSONAL' as ClassType, label: '개인 PT' },
        ]}
        onChange={setClassType}
      />
      <Field
        label="소요 시간 (분)"
        value={durationMin}
        onChangeText={setDurationMin}
        keyboardType="number-pad"
      />
      <Field
        label="기본 정원 (명)"
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="number-pad"
      />
    </FormSheet>
  );
}

// ---------------------------------------------------------------- 회차 개설

function SessionFormSheet({
  program,
  onClose,
  onCreated,
}: {
  program: Program | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const create = useCreateSession(program?.id ?? 0);
  const rooms = usePlaceRooms(program?.placeId ?? 0, !!program);

  const [roomId, setRoomId] = useState<number | null>(null);
  const [dayOffset, setDayOffset] = useState(1);
  const [time, setTime] = useState('19:00');
  const [error, setError] = useState<string | null>(null);

  const effectiveRoomId = roomId ?? rooms.data?.[0]?.id ?? null;

  const submit = () => {
    if (!program) return;
    if (!effectiveRoomId) return setError('강습실을 선택해주세요.');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return setError('시간은 HH:MM 형식이어야 합니다. 예: 19:00');
    }

    const target = new Date();
    target.setDate(target.getDate() + dayOffset);
    const [h, m] = time.split(':').map(Number);
    target.setHours(h, m, 0, 0);

    if (target.getTime() <= Date.now()) {
      return setError('미래 시각만 개설할 수 있습니다.');
    }

    // 서버는 오프셋 없는 로컬 시각을 기대한다.
    const startAt = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}:00`;

    setError(null);
    create.mutate(
      { roomId: effectiveRoomId, startAt },
      {
        onSuccess: onCreated,
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  const dayOptions = [1, 2, 3, 7].map((d) => {
    const t = new Date();
    t.setDate(t.getDate() + d);
    return { value: d, label: `${t.getMonth() + 1}/${t.getDate()}` };
  });

  return (
    <FormSheet
      visible={!!program}
      title="회차 개설"
      description={
        program
          ? `${program.name} · ${program.durationMin}분 · 정원 ${program.defaultCapacity}명\n종료 시각은 소요 시간으로 자동 계산됩니다.`
          : undefined
      }
      submitText="개설"
      submitting={create.isPending}
      error={error}
      onSubmit={submit}
      onClose={onClose}
    >
      <ChoiceGroup
        label="강습실"
        value={effectiveRoomId}
        options={(rooms.data ?? []).map((r) => ({
          value: r.id,
          label: `${r.roomNum} ${r.name ?? ''}`.trim(),
        }))}
        onChange={setRoomId}
      />
      <ChoiceGroup label="날짜" value={dayOffset} options={dayOptions} onChange={setDayOffset} />
      <Field label="시작 시각 (HH:MM)" value={time} onChangeText={setTime} placeholder="19:00" />
    </FormSheet>
  );
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    margin: spacing.lg,
    marginBottom: 0,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface },
  tabText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },

  list: { padding: spacing.lg, flexGrow: 1 },
  dateHeader: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  description: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20 },
  pendingNote: { fontSize: fontSize.xs, color: colors.warning, marginTop: spacing.sm, fontWeight: '600' },

  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textFaint,
    marginTop: spacing.sm,
  },
});
