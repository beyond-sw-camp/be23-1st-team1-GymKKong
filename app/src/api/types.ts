/**
 * 백엔드 DTO에 대응하는 타입.
 * 서버의 com.gymkkong.api.dto 패키지와 1:1로 맞춰져 있다.
 */

export type Role = 'MEMBER' | 'TRAINER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type Gender = 'M' | 'F' | 'OTHER';
export type ClassType = 'GROUP' | 'PERSONAL';
export type ClassLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL';
export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
export type PlanScope = 'GROUP' | 'PERSONAL' | 'ALL';
export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'REFUNDED' | 'SUSPENDED';
export type ReservationStatus = 'RESERVED' | 'CANCELED' | 'ATTENDED' | 'NOSHOW';
export type PostType = 'NOTICE' | 'FREE' | 'QNA';
export type PaymentMethod = 'CARD' | 'TRANSFER' | 'KAKAOPAY' | 'TOSS' | 'ONSITE';
export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type PlaceTrainerStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'INACTIVE';
export type NotificationType =
  | 'RESERVATION'
  | 'CLASS_CANCELED'
  | 'MEMBERSHIP_EXPIRING'
  | 'PAYMENT'
  | 'COMMENT'
  | 'NOTICE';

/** 서버가 내려주는 오류 형식. 앱은 code로 분기한다. */
export interface ApiErrorBody {
  code: string;
  message: string;
  errors: { field: string; reason: string }[];
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface User {
  id: number;
  email: string;
  name: string;
  phoneNum: string | null;
  role: Role;
  status: UserStatus;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface PlaceSummary {
  id: number;
  name: string;
  address: string;
  phoneNum: string | null;
  latitude: number | null;
  longitude: number | null;
  openTime: string | null;
  closeTime: string | null;
  imageUrl: string | null;
  favorite: boolean;
}

export interface PlaceDetail extends PlaceSummary {
  addressDetail: string | null;
  description: string | null;
}

export interface TrainerSummary {
  userId: number;
  name: string;
  specialty: string | null;
  careerYears: number | null;
  profileImageUrl: string | null;
  status: PlaceTrainerStatus;
}

/** 관리자 승인 대기 목록. 승인 API는 placeTrainerId를 받는다(userId 아님). */
export interface PendingTrainer {
  placeTrainerId: number;
  userId: number;
  name: string;
  email: string;
  phoneNum: string | null;
  specialty: string | null;
  careerYears: number | null;
  requestedAt: string;
}

export interface MyPlace {
  placeId: number;
  placeName: string;
  address: string;
  status: PlaceTrainerStatus;
}

export interface RoomResponse {
  id: number;
  roomNum: string;
  name: string | null;
  capacity: number;
}

export interface Plan {
  id: number;
  placeId: number;
  name: string;
  totalCount: number;
  price: number;
  validDays: number;
  classType: PlanScope;
}

export interface Program {
  id: number;
  placeId: number;
  placeName: string;
  trainerUserId: number;
  trainerName: string;
  name: string;
  description: string | null;
  classType: ClassType;
  level: ClassLevel;
  durationMin: number;
  defaultCapacity: number;
  imageUrl: string | null;
}

export interface Session {
  id: number;
  programId: number;
  programName: string;
  classType: ClassType;
  level: ClassLevel;
  startAt: string;
  endAt: string;
  capacity: number;
  reservedCount: number;
  remainSeat: number;
  status: SessionStatus;
  placeId: number;
  placeName: string;
  roomNum: string;
  trainerUserId: number;
  trainerName: string;
  reservedByMe: boolean;
}

export interface Reservation {
  id: number;
  status: ReservationStatus;
  reservedAt: string;
  canceledAt: string | null;
  checkedAt: string | null;
  sessionId: number;
  programName: string;
  startAt: string;
  endAt: string;
  placeName: string;
  roomNum: string;
  trainerName: string;
  membershipId: number;
  membershipRemainCount: number;
  cancelable: boolean;
}

export interface Membership {
  id: number;
  planId: number;
  planName: string;
  placeId: number;
  placeName: string;
  classType: PlanScope;
  totalCount: number;
  remainCount: number;
  startDate: string;
  expireDate: string;
  status: MembershipStatus;
  refundable: boolean;
  expectedRefundAmount: number | null;
}

export interface Payment {
  id: number;
  membershipId: number;
  planName: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  paidAt: string | null;
}

export interface Refund {
  id: number;
  paymentId: number;
  membershipId: number;
  memberName: string;
  planName: string;
  amount: number;
  reason: string | null;
  status: RefundStatus;
  requestedAt: string;
  processedAt: string | null;
}

export interface PostSummary {
  id: number;
  postType: PostType;
  title: string;
  authorName: string;
  authorRole: Role;
  viewCount: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
}

export interface PostDetail extends PostSummary {
  placeId: number;
  placeName: string;
  content: string;
  authorUserId: number;
  mine: boolean;
}

export interface Comment {
  id: number;
  parentId: number | null;
  content: string;
  authorUserId: number;
  authorName: string;
  authorRole: Role;
  createdAt: string;
  mine: boolean;
}

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  linkType: string | null;
  linkId: number | null;
  read: boolean;
  createdAt: string;
}

/** 트레이너 출석 화면의 한 줄. */
export interface RosterRow {
  reservationId: number;
  memberUserId: number;
  memberName: string;
  memberPhone: string | null;
  status: ReservationStatus;
  reservedAt: string;
  checkedAt: string | null;
}
