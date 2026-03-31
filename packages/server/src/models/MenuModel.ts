import mongoose, { Schema, Document } from 'mongoose';

export interface IMenu extends Document {
  storeId: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  imageUrl?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const MenuSchema = new Schema<IMenu>(
  {
    storeId: { type: String, required: true },
    name: { type: String, required: true, maxlength: 100 },
    price: { type: Number, required: true, min: 100, max: 1_000_000 },
    description: { type: String, maxlength: 500 },
    category: { type: String, required: true, maxlength: 50 },
    imageUrl: { type: String },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

MenuSchema.index({ storeId: 1, category: 1 });
MenuSchema.index({ storeId: 1, sortOrder: 1 });

export default mongoose.model<IMenu>('Menu', MenuSchema);
