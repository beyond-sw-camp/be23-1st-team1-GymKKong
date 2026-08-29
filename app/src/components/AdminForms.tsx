import React, { useState } from 'react';

import { errorMessage } from '../api/client';
import { useCreatePlace, useCreatePlan, useCreateRoom } from '../api/hooks';
import type { PlanScope } from '../api/types';
import { ChoiceGroup, FormSheet } from './FormSheet';
import { Field } from './ui';

/** 지점 신규 등록. SUPER_ADMIN만 호출할 수 있다(서버에서도 검사). */
export function PlaceFormSheet({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const create = useCreatePlace();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return setError('지점명을 입력해주세요.');
    if (!address.trim()) return setError('주소를 입력해주세요.');

    const lat = latitude.trim() ? Number(latitude) : undefined;
    const lng = longitude.trim() ? Number(longitude) : undefined;
    if (lat !== undefined && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
      return setError('위도는 -90 ~ 90 사이여야 합니다.');
    }
    if (lng !== undefined && (!Number.isFinite(lng) || lng < -180 || lng > 180)) {
      return setError('경도는 -180 ~ 180 사이여야 합니다.');
    }

    setError(null);
    create.mutate(
      {
        name: name.trim(),
        address: address.trim(),
        phoneNum: phoneNum.trim() || undefined,
        latitude: lat,
        longitude: lng,
      },
      {
        onSuccess: () => {
          setName('');
          setAddress('');
          setPhoneNum('');
          setLatitude('');
          setLongitude('');
          onCreated();
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <FormSheet
      visible={visible}
      title="지점 등록"
      description="좌표를 넣으면 앱의 '내 주변 지점'에 노출됩니다."
      submitText="등록"
      submitting={create.isPending}
      error={error}
      onSubmit={submit}
      onClose={onClose}
    >
      <Field label="지점명" value={name} onChangeText={setName} placeholder="짐꽁 판교점" />
      <Field
        label="주소"
        value={address}
        onChangeText={setAddress}
        placeholder="경기도 성남시 분당구 판교역로 1"
      />
      <Field
        label="전화 (선택)"
        value={phoneNum}
        onChangeText={setPhoneNum}
        placeholder="031-000-0000"
        keyboardType="phone-pad"
      />
      <Field
        label="위도 (선택)"
        value={latitude}
        onChangeText={setLatitude}
        placeholder="37.3947"
        keyboardType="numbers-and-punctuation"
      />
      <Field
        label="경도 (선택)"
        value={longitude}
        onChangeText={setLongitude}
        placeholder="127.1112"
        keyboardType="numbers-and-punctuation"
      />
    </FormSheet>
  );
}

/** 강습실 등록. */
export function RoomFormSheet({
  placeId,
  visible,
  onClose,
  onCreated,
}: {
  placeId: number;
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const create = useCreateRoom(placeId);
  const [roomNum, setRoomNum] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('12');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!roomNum.trim()) return setError('강습실 번호를 입력해주세요.');
    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap < 1) return setError('수용 인원은 1명 이상이어야 합니다.');

    setError(null);
    create.mutate(
      { roomNum: roomNum.trim(), name: name.trim() || undefined, capacity: cap },
      {
        onSuccess: () => {
          setRoomNum('');
          setName('');
          onCreated();
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <FormSheet
      visible={visible}
      title="강습실 등록"
      submitText="등록"
      submitting={create.isPending}
      error={error}
      onSubmit={submit}
      onClose={onClose}
    >
      <Field label="강습실 번호" value={roomNum} onChangeText={setRoomNum} placeholder="104" />
      <Field label="이름 (선택)" value={name} onChangeText={setName} placeholder="GX룸 B" />
      <Field
        label="수용 인원"
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="number-pad"
      />
    </FormSheet>
  );
}

/** 이용권 상품 등록. */
export function PlanFormSheet({
  placeId,
  visible,
  onClose,
  onCreated,
}: {
  placeId: number;
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const create = useCreatePlan(placeId);
  const [name, setName] = useState('');
  const [totalCount, setTotalCount] = useState('10');
  const [price, setPrice] = useState('150000');
  const [validDays, setValidDays] = useState('90');
  const [classType, setClassType] = useState<PlanScope>('GROUP');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return setError('상품명을 입력해주세요.');
    const count = Number(totalCount);
    const amount = Number(price);
    const days = Number(validDays);
    if (!Number.isFinite(count) || count < 1) return setError('횟수는 1회 이상이어야 합니다.');
    if (!Number.isFinite(amount) || amount < 0) return setError('가격이 올바르지 않습니다.');
    if (!Number.isFinite(days) || days < 1) return setError('유효기간은 1일 이상이어야 합니다.');

    setError(null);
    create.mutate(
      { name: name.trim(), totalCount: count, price: amount, validDays: days, classType },
      {
        onSuccess: () => {
          setName('');
          onCreated();
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <FormSheet
      visible={visible}
      title="이용권 상품 등록"
      description="회원이 지점 상세에서 바로 구매할 수 있습니다."
      submitText="등록"
      submitting={create.isPending}
      error={error}
      onSubmit={submit}
      onClose={onClose}
    >
      <Field label="상품명" value={name} onChangeText={setName} placeholder="그룹 30회권" />
      <ChoiceGroup
        label="이용 범위"
        value={classType}
        options={[
          { value: 'GROUP' as PlanScope, label: '그룹' },
          { value: 'PERSONAL' as PlanScope, label: '개인 PT' },
          { value: 'ALL' as PlanScope, label: '전체' },
        ]}
        onChange={setClassType}
      />
      <Field label="횟수" value={totalCount} onChangeText={setTotalCount} keyboardType="number-pad" />
      <Field label="가격 (원)" value={price} onChangeText={setPrice} keyboardType="number-pad" />
      <Field
        label="유효기간 (일)"
        value={validDays}
        onChangeText={setValidDays}
        keyboardType="number-pad"
      />
    </FormSheet>
  );
}
