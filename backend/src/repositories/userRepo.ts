import { filter, findById, findOne, getStore, type StoreRow } from '../lib/store/index.js';
import { newId, nowIso } from '../lib/util.js';
import type { User, UserRole, UserStatus } from '../models/types.js';

const TABLE = 'Users' as const;

function toRow(user: User): StoreRow {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    passwordHash: user.passwordHash,
    role: user.role,
    status: user.status,
    mobile: user.mobile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function fromRow(row: StoreRow): User {
  return {
    id: row['id'] ?? '',
    name: row['name'] ?? '',
    username: row['username'] ?? '',
    passwordHash: row['passwordHash'] ?? '',
    role: (row['role'] as UserRole) || 'DRIVER',
    status: (row['status'] as UserStatus) || 'ACTIVE',
    mobile: row['mobile'] ?? '',
    createdAt: row['createdAt'] ?? '',
    updatedAt: row['updatedAt'] ?? '',
  };
}

export async function listUsers(role?: UserRole): Promise<User[]> {
  const store = await getStore();
  const rows = role
    ? await filter(store, TABLE, (r) => r['role'] === role)
    : await store.getAll(TABLE);
  return rows.map(fromRow);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const store = await getStore();
  const row = await findById(store, TABLE, id);
  return row ? fromRow(row) : undefined;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const store = await getStore();
  const target = username.trim().toLowerCase();
  const row = await findOne(store, TABLE, (r) => (r['username'] ?? '').toLowerCase() === target);
  return row ? fromRow(row) : undefined;
}

export interface CreateUserInput {
  name: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  mobile?: string;
  status?: UserStatus;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const store = await getStore();
  const now = nowIso();
  const user: User = {
    id: newId(),
    name: input.name,
    username: input.username,
    passwordHash: input.passwordHash,
    role: input.role,
    status: input.status ?? 'ACTIVE',
    mobile: input.mobile ?? '',
    createdAt: now,
    updatedAt: now,
  };
  await store.insert(TABLE, toRow(user));
  return user;
}

export type UpdateUserInput = Partial<
  Pick<User, 'name' | 'mobile' | 'status' | 'passwordHash'>
>;

export async function updateUser(id: string, patch: UpdateUserInput): Promise<User | undefined> {
  const store = await getStore();
  const existing = await getUserById(id);
  if (!existing) return undefined;
  const updated: User = { ...existing, ...patch, updatedAt: nowIso() };
  const row = await store.update(TABLE, id, toRow(updated));
  return row ? fromRow(row) : undefined;
}

export async function deleteUser(id: string): Promise<boolean> {
  const store = await getStore();
  return store.remove(TABLE, id);
}
