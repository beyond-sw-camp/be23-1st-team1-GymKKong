import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from './client';
import type {
  AppNotification,
  Comment,
  Membership,
  MyPlace,
  PageResponse,
  PendingTrainer,
  Payment,
  PlaceDetail,
  PlaceSummary,
  Plan,
  PostDetail,
  PostSummary,
  Program,
  Refund,
  Reservation,
  ReservationStatus,
  RoomResponse,
  RosterRow,
  Session,
  TrainerSummary,
} from './types';

/** 쿼리 키를 한곳에서 관리해 무효화 대상을 놓치지 않게 한다. */
export const qk = {
  places: (keyword?: string) => ['places', keyword ?? ''] as const,
  nearby: (lat: number, lng: number) => ['places', 'nearby', lat, lng] as const,
  place: (id: number) => ['place', id] as const,
  placeTrainers: (id: number) => ['place', id, 'trainers'] as const,
  placeRooms: (id: number) => ['place', id, 'rooms'] as const,
  placePlans: (id: number) => ['place', id, 'plans'] as const,
  placePrograms: (id: number) => ['place', id, 'programs'] as const,
  timetable: (id: number, date: string, days: number) => ['timetable', id, date, days] as const,
  session: (id: number) => ['session', id] as const,
  myReservations: (statuses: string) => ['reservations', 'me', statuses] as const,
  myMemberships: () => ['memberships', 'me'] as const,
  myPayments: () => ['payments', 'me'] as const,
  notifications: () => ['notifications'] as const,
  unreadCount: () => ['notifications', 'unread'] as const,
  favorites: () => ['favorites'] as const,
  posts: (placeId: number, type?: string) => ['posts', placeId, type ?? ''] as const,
  post: (id: number) => ['post', id] as const,
  comments: (postId: number) => ['post', postId, 'comments'] as const,
  trainerPlaces: () => ['trainer', 'places'] as const,
  trainerPrograms: () => ['trainer', 'programs'] as const,
  trainerSessions: (from: string, days: number) => ['trainer', 'sessions', from, days] as const,
  roster: (sessionId: number) => ['trainer', 'roster', sessionId] as const,
  adminPending: (placeId: number) => ['admin', 'pending', placeId] as const,
  adminRefunds: () => ['admin', 'refunds'] as const,
};

const get = async <T,>(url: string, params?: object): Promise<T> => {
  const { data } = await api.get<T>(url, { params });
  return data;
};

// ---------------------------------------------------------------- 지점

export const usePlaces = (keyword?: string) =>
  useQuery({
    queryKey: qk.places(keyword),
    queryFn: () => get<PageResponse<PlaceSummary>>('/api/places', { keyword, size: 50 }),
  });

export const useNearbyPlaces = (lat?: number, lng?: number) =>
  useQuery({
    queryKey: qk.nearby(lat ?? 0, lng ?? 0),
    queryFn: () => get<PlaceSummary[]>('/api/places/nearby', { lat, lng, radiusKm: 10 }),
    enabled: lat != null && lng != null,
  });

export const usePlace = (id: number) =>
  useQuery({ queryKey: qk.place(id), queryFn: () => get<PlaceDetail>(`/api/places/${id}`) });

export const usePlaceTrainers = (id: number) =>
  useQuery({
    queryKey: qk.placeTrainers(id),
    queryFn: () => get<TrainerSummary[]>(`/api/places/${id}/trainers`),
  });

export const usePlaceRooms = (id: number, enabled = true) =>
  useQuery({
    queryKey: qk.placeRooms(id),
    queryFn: () => get<RoomResponse[]>(`/api/places/${id}/rooms`),
    enabled,
  });

export const usePlacePlans = (id: number) =>
  useQuery({ queryKey: qk.placePlans(id), queryFn: () => get<Plan[]>(`/api/places/${id}/plans`) });

export const usePlacePrograms = (id: number) =>
  useQuery({
    queryKey: qk.placePrograms(id),
    queryFn: () => get<Program[]>(`/api/places/${id}/programs`),
  });

export const useFavorites = () =>
  useQuery({ queryKey: qk.favorites(), queryFn: () => get<PlaceSummary[]>('/api/me/favorites') });

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (placeId: number) =>
      api.post<{ favorite: boolean }>(`/api/me/favorites/${placeId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.favorites() });
      void qc.invalidateQueries({ queryKey: ['places'] });
      void qc.invalidateQueries({ queryKey: ['place'] });
    },
  });
}

// ---------------------------------------------------------------- 시간표 / 수업

export const useTimetable = (placeId: number, date: string, days = 7) =>
  useQuery({
    queryKey: qk.timetable(placeId, date, days),
    queryFn: () => get<Session[]>(`/api/places/${placeId}/sessions`, { date, days }),
    enabled: placeId > 0,
  });

export const useSession = (id: number) =>
  useQuery({ queryKey: qk.session(id), queryFn: () => get<Session>(`/api/sessions/${id}`) });

// ---------------------------------------------------------------- 예약

export const useMyReservations = (statuses?: ReservationStatus[]) =>
  useQuery({
    queryKey: qk.myReservations((statuses ?? []).join(',')),
    queryFn: () =>
      get<PageResponse<Reservation>>('/api/reservations/me', {
        status: statuses,
        size: 50,
      }),
  });

/**
 * 예약 성공 시 이용권/시간표/예약 목록을 모두 갱신해야 화면이 어긋나지 않는다.
 * 화면별 후처리는 호출부에서 mutate(vars, { onSuccess, onError })로 넘긴다.
 */
export function useReserve() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { sessionId: number; membershipId?: number }) =>
      api.post<Reservation>('/api/reservations', body).then((r) => r.data),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['reservations'] });
      void qc.invalidateQueries({ queryKey: ['memberships'] });
      void qc.invalidateQueries({ queryKey: ['timetable'] });
      void qc.invalidateQueries({ queryKey: qk.session(vars.sessionId) });
      void qc.invalidateQueries({ queryKey: qk.unreadCount() });
    },
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: number) => api.delete(`/api/reservations/${reservationId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reservations'] });
      void qc.invalidateQueries({ queryKey: ['memberships'] });
      void qc.invalidateQueries({ queryKey: ['timetable'] });
      void qc.invalidateQueries({ queryKey: ['session'] });
    },
  });
}

// ---------------------------------------------------------------- 이용권 / 결제

export const useMyMemberships = () =>
  useQuery({ queryKey: qk.myMemberships(), queryFn: () => get<Membership[]>('/api/me/memberships') });

export const useMyPayments = () =>
  useQuery({ queryKey: qk.myPayments(), queryFn: () => get<Payment[]>('/api/me/payments') });

export function usePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { planId: number; method?: string }) =>
      api.post<Membership>('/api/me/memberships', body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['memberships'] });
      void qc.invalidateQueries({ queryKey: ['payments'] });
      void qc.invalidateQueries({ queryKey: qk.unreadCount() });
    },
  });
}

export function useRequestRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, reason }: { membershipId: number; reason?: string }) =>
      api.post<Refund>(`/api/me/memberships/${membershipId}/refund`, { reason }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['memberships'] });
    },
  });
}

// ---------------------------------------------------------------- 알림

export const useNotifications = () =>
  useQuery({
    queryKey: qk.notifications(),
    queryFn: () => get<PageResponse<AppNotification>>('/api/me/notifications', { size: 50 }),
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: qk.unreadCount(),
    queryFn: () => get<{ count: number }>('/api/me/notifications/unread-count'),
    refetchInterval: 60_000,
  });

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/api/me/notifications/${id}/read`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.notifications() });
      void qc.invalidateQueries({ queryKey: qk.unreadCount() });
    },
  });
}

// ---------------------------------------------------------------- 게시판

export const usePosts = (placeId: number, type?: string) =>
  useQuery({
    queryKey: qk.posts(placeId, type),
    queryFn: () => get<PageResponse<PostSummary>>(`/api/places/${placeId}/posts`, { type, size: 50 }),
    enabled: placeId > 0,
  });

export const usePost = (id: number) =>
  useQuery({ queryKey: qk.post(id), queryFn: () => get<PostDetail>(`/api/posts/${id}`) });

export const useComments = (postId: number) =>
  useQuery({
    queryKey: qk.comments(postId),
    queryFn: () => get<Comment[]>(`/api/posts/${postId}/comments`),
  });

export function useCreatePost(placeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { postType: string; title: string; content: string }) =>
      api.post<PostDetail>(`/api/places/${placeId}/posts`, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['posts', placeId] });
    },
  });
}

export function useAddComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: string; parentId?: number }) =>
      api.post<Comment>(`/api/posts/${postId}/comments`, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.comments(postId) });
      void qc.invalidateQueries({ queryKey: qk.post(postId) });
    },
  });
}

// ---------------------------------------------------------------- 트레이너

export const useTrainerPlaces = (enabled = true) =>
  useQuery({
    queryKey: qk.trainerPlaces(),
    queryFn: () => get<MyPlace[]>('/api/trainer/places'),
    enabled,
  });

export const useTrainerPrograms = (enabled = true) =>
  useQuery({
    queryKey: qk.trainerPrograms(),
    queryFn: () => get<Program[]>('/api/trainer/programs'),
    enabled,
  });

export const useTrainerSessions = (from: string, days = 7, enabled = true) =>
  useQuery({
    queryKey: qk.trainerSessions(from, days),
    queryFn: () => get<Session[]>('/api/trainer/sessions', { from, days }),
    enabled,
  });

export const useRoster = (sessionId: number) =>
  useQuery({
    queryKey: qk.roster(sessionId),
    queryFn: () => get<RosterRow[]>(`/api/trainer/sessions/${sessionId}/roster`),
    enabled: sessionId > 0,
  });

export function useCheckAttendance(sessionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { reservationId: number; status: ReservationStatus }[]) =>
      api.post(`/api/trainer/sessions/${sessionId}/attendance`, { items }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.roster(sessionId) });
      void qc.invalidateQueries({ queryKey: ['trainer', 'sessions'] });
    },
  });
}

export function useJoinPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (placeId: number) => api.post('/api/trainer/places', { placeId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.trainerPlaces() });
    },
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      placeId: number;
      name: string;
      description?: string;
      classType: string;
      level?: string;
      durationMin: number;
      defaultCapacity: number;
    }) => api.post<Program>('/api/trainer/programs', body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.trainerPrograms() });
    },
  });
}

export function useCreateSession(programId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { roomId: number; startAt: string; capacity?: number }) =>
      api.post<Session>(`/api/trainer/programs/${programId}/sessions`, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['trainer', 'sessions'] });
      void qc.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
}

export function useCancelSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: number; reason?: string }) =>
      api
        .post<{ canceledReservations: number }>(`/api/trainer/sessions/${sessionId}/cancel`, { reason })
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['trainer', 'sessions'] });
      void qc.invalidateQueries({ queryKey: ['timetable'] });
      void qc.invalidateQueries({ queryKey: ['session'] });
    },
  });
}

// ---------------------------------------------------------------- 관리자

export const useAdminPendingTrainers = (placeId: number) =>
  useQuery({
    queryKey: qk.adminPending(placeId),
    queryFn: () => get<PendingTrainer[]>(`/api/admin/places/${placeId}/trainers/pending`),
    enabled: placeId > 0,
  });

export const useAdminRefunds = () =>
  useQuery({
    queryKey: qk.adminRefunds(),
    queryFn: () => get<PageResponse<Refund>>('/api/admin/refunds', { size: 50 }),
  });

export function useDecideRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ refundId, approve, reason }: { refundId: number; approve: boolean; reason?: string }) =>
      api.post<Refund>(`/api/admin/refunds/${refundId}/decision`, { approve, reason }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.adminRefunds() });
    },
  });
}
