import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminAccount extends Document {
  storeId: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

const adminAccountSchema = new Schema<IAdminAccount>({
  storeId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// 복합 인덱스: storeId + username 조합으로 빠른 조회
adminAccountSchema.index({ storeId: 1, username: 1 }, { unique: true });

export const AdminAccount = mongoose.model<IAdminAccount>('AdminAccount', adminAccountSchema);
