// 테이블 모델 단위 테스트
// Unit 5: 테이블 관리 — TableModel 스키마 검증

import mongoose from 'mongoose';

// mongoose 연결 없이 스키마만 테스트하기 위해 직접 import
import TableModel from '../../models/TableModel';

describe('TableModel', () => {
  // --- 필수 필드 검증 (storeId, tableNumber, password) ---
  describe('required field validation', () => {
    it('storeId 누락 시 validation error 발생', async () => {
      const doc = new TableModel({ tableNumber: 1, password: 'hashed' });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err!.errors.storeId).toBeDefined();
    });

    it('tableNumber 누락 시 validation error 발생', async () => {
      const doc = new TableModel({ storeId: 'store1', password: 'hashed' });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err!.errors.tableNumber).toBeDefined();
    });

    it('password 누락 시 validation error 발생', async () => {
      const doc = new TableModel({ storeId: 'store1', tableNumber: 1 });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err!.errors.password).toBeDefined();
    });

    it('모든 필수 필드 제공 시 validation 통과', () => {
      const doc = new TableModel({ storeId: 'store1', tableNumber: 1, password: 'hashed' });
      const err = doc.validateSync();
      expect(err).toBeUndefined();
    });
  });

  // --- 기본값 검증 ---
  describe('default values', () => {
    it('isActive 기본값은 false', () => {
      const doc = new TableModel({ storeId: 'store1', tableNumber: 1, password: 'hashed' });
      expect(doc.isActive).toBe(false);
    });

    it('currentSessionId 기본값은 null', () => {
      const doc = new TableModel({ storeId: 'store1', tableNumber: 1, password: 'hashed' });
      expect(doc.currentSessionId).toBeNull();
    });

    it('sessionStartedAt 기본값은 null', () => {
      const doc = new TableModel({ storeId: 'store1', tableNumber: 1, password: 'hashed' });
      expect(doc.sessionStartedAt).toBeNull();
    });
  });

  // --- toJSON transform: password, __v 제거 (BR-TABLE-02) ---
  describe('toJSON transform', () => {
    it('password 필드가 응답에서 제거됨', () => {
      const doc = new TableModel({ storeId: 'store1', tableNumber: 1, password: 'secret' });
      const json = doc.toJSON();
      expect(json).not.toHaveProperty('password');
    });

    it('__v 필드가 응답에서 제거됨', () => {
      const doc = new TableModel({ storeId: 'store1', tableNumber: 1, password: 'secret' });
      (doc as any).__v = 0;
      const json = doc.toJSON();
      expect(json).not.toHaveProperty('__v');
    });

    it('다른 필드(storeId, tableNumber 등)는 유지됨', () => {
      const doc = new TableModel({ storeId: 'store1', tableNumber: 5, password: 'secret' });
      const json = doc.toJSON();
      expect(json).toHaveProperty('storeId', 'store1');
      expect(json).toHaveProperty('tableNumber', 5);
      expect(json).toHaveProperty('isActive', false);
    });
  });

  // --- 복합 유니크 인덱스 { storeId, tableNumber } (BR-TABLE-01) ---
  describe('compound unique index', () => {
    it('{ storeId, tableNumber } 복합 유니크 인덱스가 정의됨', () => {
      const indexes = TableModel.schema.indexes();
      const compoundIndex = indexes.find(
        ([fields, options]) =>
          fields.storeId === 1 &&
          fields.tableNumber === 1 &&
          (options as any)?.unique === true
      );
      expect(compoundIndex).toBeDefined();
    });
  });
});
