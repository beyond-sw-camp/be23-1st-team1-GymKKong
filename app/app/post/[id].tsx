import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { errorMessage } from '../../src/api/client';
import { useAddComment, useComments, usePost } from '../../src/api/hooks';
import { Badge, Button, Card, Divider, ErrorState, Loading } from '../../src/components/ui';
import { useAuth } from '../../src/lib/AuthProvider';
import { formatDateTime, relativeTime } from '../../src/lib/format';
import { colors, fontSize, radius, spacing } from '../../src/theme';

const ROLE_LABEL: Record<string, string> = {
  MEMBER: '회원',
  TRAINER: '트레이너',
  ADMIN: '관리자',
  SUPER_ADMIN: '관리자',
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const { user } = useAuth();

  const postQuery = usePost(postId);
  const commentsQuery = useComments(postId);
  const addComment = useAddComment(postId);

  const [draft, setDraft] = useState('');

  const submit = () => {
    const content = draft.trim();
    if (!content) return;
    addComment.mutate(
      { content },
      {
        onSuccess: () => setDraft(''),
        onError: (e) => Alert.alert('댓글 등록 실패', errorMessage(e)),
      },
    );
  };

  if (postQuery.isLoading) return <Loading />;
  if (postQuery.isError || !postQuery.data) {
    return (
      <ErrorState
        message={errorMessage(postQuery.error, '게시글을 찾을 수 없습니다.')}
        onRetry={() => postQuery.refetch()}
      />
    );
  }

  const post = postQuery.data;
  const comments = commentsQuery.data ?? [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.titleRow}>
            <Badge value={post.postType} />
            {post.isPinned && <Text style={styles.pin}>📌 고정</Text>}
          </View>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.meta}>
            {post.authorName} ({ROLE_LABEL[post.authorRole] ?? post.authorRole}) ·{' '}
            {formatDateTime(post.createdAt)} · 조회 {post.viewCount}
          </Text>

          <Divider />

          <Text style={styles.body}>{post.content}</Text>
        </Card>

        <Text style={styles.sectionTitle}>댓글 {post.commentCount}</Text>
        <Card>
          {commentsQuery.isLoading ? (
            <Text style={styles.empty}>불러오는 중…</Text>
          ) : comments.length === 0 ? (
            <Text style={styles.empty}>첫 댓글을 남겨보세요.</Text>
          ) : (
            comments.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <Divider />}
                <View style={[styles.comment, c.parentId != null && styles.reply]}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{c.authorName}</Text>
                    <Badge
                      value={c.authorRole}
                      label={ROLE_LABEL[c.authorRole] ?? c.authorRole}
                    />
                    {c.mine && <Text style={styles.mine}>내 댓글</Text>}
                    <View style={{ flex: 1 }} />
                    <Text style={styles.commentTime}>{relativeTime(c.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentBody}>{c.content}</Text>
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {!!user && (
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="댓글을 입력하세요"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            multiline
            maxLength={1000}
          />
          <Button
            title="등록"
            small
            disabled={!draft.trim()}
            loading={addComment.isPending}
            onPress={submit}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pin: { fontSize: fontSize.xs, color: colors.textMuted },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  meta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  body: { fontSize: fontSize.md, color: colors.text, lineHeight: 24 },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  empty: { fontSize: fontSize.sm, color: colors.textFaint, textAlign: 'center', paddingVertical: spacing.sm },

  comment: { paddingVertical: spacing.sm },
  reply: { paddingLeft: spacing.xl, borderLeftWidth: 2, borderLeftColor: colors.border },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  commentAuthor: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  mine: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  commentTime: { fontSize: fontSize.xs, color: colors.textFaint },
  commentBody: { fontSize: fontSize.sm, color: colors.text, marginTop: spacing.xs, lineHeight: 20 },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    backgroundColor: colors.background,
  },
});
