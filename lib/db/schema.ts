import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const projectVisibilityEnum = pgEnum("project_visibility", [
  "private",
  "public",
]);

export const annotationTypeEnum = pgEnum("annotation_type", [
  "highlight",
  "note",
  "question",
  "interpretation",
]);

export const versionEditActionEnum = pgEnum("version_edit_action", [
  "create",
  "update",
  "delete",
]);

export const suggestionStatusEnum = pgEnum("suggestion_status", [
  "open",
  "accepted",
  "declined",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "suggestion_received",
  "suggestion_accepted",
  "suggestion_declined",
  "project_forked",
  "comment_received",
]);

export const pendingActionEnum = pgEnum("pending_action", [
  "create",
  "update",
  "delete",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  })
);

export const books = pgTable(
  "books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    author: text("author").notNull(),
    description: text("description"),
    coverUrl: text("cover_url"),
    olKey: text("ol_key"),
    license: text("license").notNull().default("public-domain"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("books_slug_idx").on(table.slug),
    authorIdx: index("books_author_idx").on(table.author),
    olKeyIdx: uniqueIndex("books_ol_key_idx").on(table.olKey),
  })
);

export const chapters = pgTable(
  "chapters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    bookPositionIdx: uniqueIndex("chapters_book_position_idx").on(
      table.bookId,
      table.position
    ),
  })
);

export const passages = pgTable(
  "passages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    chapterPositionIdx: uniqueIndex("passages_chapter_position_idx").on(
      table.chapterId,
      table.position
    ),
  })
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    visibility: projectVisibilityEnum("visibility").notNull().default("private"),
    forkedFromId: uuid("forked_from_id").references(
      (): AnyPgColumn => projects.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerSlugIdx: uniqueIndex("projects_owner_slug_idx").on(
      table.ownerId,
      table.slug
    ),
    bookIdx: index("projects_book_idx").on(table.bookId),
    visibilityIdx: index("projects_visibility_idx").on(table.visibility),
    forkedFromIdx: index("projects_forked_from_idx").on(table.forkedFromId),
  })
);

export const annotations = pgTable(
  "annotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    passageId: uuid("passage_id")
      .notNull()
      .references(() => passages.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: annotationTypeEnum("type").notNull(),
    content: text("content").notNull(),
    isDeleted: boolean("is_deleted").notNull().default(false),
    isDraft: boolean("is_draft").notNull().default(true),
    pendingAction: pendingActionEnum("pending_action"),
    forkedFromAnnotationId: uuid("forked_from_annotation_id").references(
      (): AnyPgColumn => annotations.id,
      { onDelete: "set null" }
    ),
    startOffset: integer("start_offset"),
    endOffset: integer("end_offset"),
    selectedText: text("selected_text"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectPassageIdx: index("annotations_project_passage_idx").on(
      table.projectId,
      table.passageId
    ),
    projectIdx: index("annotations_project_idx").on(table.projectId),
    forkedFromAnnotationIdx: index("annotations_forked_from_annotation_idx").on(
      table.forkedFromAnnotationId
    ),
    pendingActionIdx: index("annotations_pending_action_idx").on(
      table.projectId,
      table.pendingAction
    ),
  })
);

export const readingProgress = pgTable(
  "reading_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    currentLocation: text("current_location"),
    progressPercentage: integer("progress_percentage").notNull().default(0),
    lastReadAt: timestamp("last_read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userProjectIdx: uniqueIndex("reading_progress_user_project_idx").on(
      table.userId,
      table.projectId
    ),
    lastReadIdx: index("reading_progress_last_read_idx").on(table.lastReadAt),
  })
);

export const versions = pgTable(
  "versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectCreatedIdx: index("versions_project_created_idx").on(
      table.projectId,
      table.createdAt
    ),
  })
);

export const versionEdits = pgTable(
  "version_edits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => versions.id, { onDelete: "cascade" }),
    annotationId: uuid("annotation_id")
      .notNull()
      .references(() => annotations.id, { onDelete: "cascade" }),
    action: versionEditActionEnum("action").notNull(),
    beforeData: jsonb("before_data"),
    afterData: jsonb("after_data"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    versionIdx: index("version_edits_version_idx").on(table.versionId),
  })
);

export const suggestions = pgTable(
  "suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceProjectId: uuid("source_project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    targetProjectId: uuid("target_project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    targetAnnotationId: uuid("target_annotation_id")
      .notNull()
      .references(() => annotations.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    proposedContent: text("proposed_content").notNull(),
    note: text("note"),
    status: suggestionStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    targetProjectIdx: index("suggestions_target_project_idx").on(
      table.targetProjectId
    ),
    targetAnnotationIdx: index("suggestions_target_annotation_idx").on(
      table.targetAnnotationId
    ),
    authorIdx: index("suggestions_author_idx").on(table.authorId),
    statusIdx: index("suggestions_status_idx").on(table.status),
  })
);

export const annotationComments = pgTable(
  "annotation_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    annotationId: uuid("annotation_id")
      .notNull()
      .references(() => annotations.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    annotationIdx: index("annotation_comments_annotation_idx").on(
      table.annotationId
    ),
  })
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    suggestionId: uuid("suggestion_id").references(() => suggestions.id, {
      onDelete: "cascade",
    }),
    annotationId: uuid("annotation_id").references(() => annotations.id, {
      onDelete: "cascade",
    }),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userReadIdx: index("notifications_user_read_idx").on(
      table.userId,
      table.isRead
    ),
    userCreatedIdx: index("notifications_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  annotations: many(annotations),
  versions: many(versions),
  sessions: many(sessions),
  readingProgress: many(readingProgress),
  suggestionsAuthored: many(suggestions),
  annotationComments: many(annotationComments),
  notifications: many(notifications, { relationName: "notificationUser" }),
  notificationsCaused: many(notifications, {
    relationName: "notificationActor",
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const booksRelations = relations(books, ({ many }) => ({
  chapters: many(chapters),
  projects: many(projects),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  book: one(books, {
    fields: [chapters.bookId],
    references: [books.id],
  }),
  passages: many(passages),
}));

export const passagesRelations = relations(passages, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [passages.chapterId],
    references: [chapters.id],
  }),
  annotations: many(annotations),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [projects.bookId],
    references: [books.id],
  }),
  forkedFrom: one(projects, {
    fields: [projects.forkedFromId],
    references: [projects.id],
    relationName: "forkedFrom",
  }),
  forks: many(projects, { relationName: "forkedFrom" }),
  annotations: many(annotations),
  versions: many(versions),
  readingProgress: many(readingProgress),
}));

export const annotationsRelations = relations(annotations, ({ one, many }) => ({
  project: one(projects, {
    fields: [annotations.projectId],
    references: [projects.id],
  }),
  passage: one(passages, {
    fields: [annotations.passageId],
    references: [passages.id],
  }),
  author: one(users, {
    fields: [annotations.authorId],
    references: [users.id],
  }),
  forkedFromAnnotation: one(annotations, {
    fields: [annotations.forkedFromAnnotationId],
    references: [annotations.id],
    relationName: "annotationFork",
  }),
  forks: many(annotations, { relationName: "annotationFork" }),
  edits: many(versionEdits),
  suggestions: many(suggestions),
  comments: many(annotationComments),
}));

export const readingProgressRelations = relations(
  readingProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [readingProgress.userId],
      references: [users.id],
    }),
    project: one(projects, {
      fields: [readingProgress.projectId],
      references: [projects.id],
    }),
  })
);

export const versionsRelations = relations(versions, ({ one, many }) => ({
  project: one(projects, {
    fields: [versions.projectId],
    references: [projects.id],
  }),
  author: one(users, {
    fields: [versions.authorId],
    references: [users.id],
  }),
  edits: many(versionEdits),
}));

export const versionEditsRelations = relations(versionEdits, ({ one }) => ({
  version: one(versions, {
    fields: [versionEdits.versionId],
    references: [versions.id],
  }),
  annotation: one(annotations, {
    fields: [versionEdits.annotationId],
    references: [annotations.id],
  }),
}));

export const suggestionsRelations = relations(suggestions, ({ one }) => ({
  sourceProject: one(projects, {
    fields: [suggestions.sourceProjectId],
    references: [projects.id],
    relationName: "suggestionSourceProject",
  }),
  targetProject: one(projects, {
    fields: [suggestions.targetProjectId],
    references: [projects.id],
    relationName: "suggestionTargetProject",
  }),
  targetAnnotation: one(annotations, {
    fields: [suggestions.targetAnnotationId],
    references: [annotations.id],
  }),
  author: one(users, {
    fields: [suggestions.authorId],
    references: [users.id],
  }),
}));

export const annotationCommentsRelations = relations(
  annotationComments,
  ({ one }) => ({
    annotation: one(annotations, {
      fields: [annotationComments.annotationId],
      references: [annotations.id],
    }),
    author: one(users, {
      fields: [annotationComments.authorId],
      references: [users.id],
    }),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: "notificationUser",
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: "notificationActor",
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
  suggestion: one(suggestions, {
    fields: [notifications.suggestionId],
    references: [suggestions.id],
  }),
  annotation: one(annotations, {
    fields: [notifications.annotationId],
    references: [annotations.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;

export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;

export type Passage = typeof passages.$inferSelect;
export type NewPassage = typeof passages.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Annotation = typeof annotations.$inferSelect;
export type NewAnnotation = typeof annotations.$inferInsert;

export type ReadingProgress = typeof readingProgress.$inferSelect;
export type NewReadingProgress = typeof readingProgress.$inferInsert;

export type Version = typeof versions.$inferSelect;
export type NewVersion = typeof versions.$inferInsert;

export type VersionEdit = typeof versionEdits.$inferSelect;
export type NewVersionEdit = typeof versionEdits.$inferInsert;

export type Suggestion = typeof suggestions.$inferSelect;
export type NewSuggestion = typeof suggestions.$inferInsert;

export type AnnotationComment = typeof annotationComments.$inferSelect;
export type NewAnnotationComment = typeof annotationComments.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;