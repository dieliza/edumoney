import type { SQLiteDatabase } from 'expo-sqlite';
import type { Movement } from '../../core/models';
import { cents } from '../../core/money';

export class MovementRepository {
  constructor(private readonly db: Pick<SQLiteDatabase, 'runAsync'>) {}
  /** La misma operación conserva su idempotencyKey en cada reintento. */
  async create(movement: Movement): Promise<void> {
    if (cents(movement.amountCents) <= 0) throw new Error('El importe debe ser positivo');
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(movement.date);
    if (!match || new Date(`${movement.date}T12:00:00Z`).toISOString().slice(0, 10) !== movement.date) throw new Error('Fecha no válida');
    if (!movement.id || !movement.idempotencyKey || !movement.description.trim()) throw new Error('Movimiento incompleto');
    await this.db.runAsync(`INSERT INTO movements
      (id, idempotency_key, kind, amount_cents, currency, date, description, category_id, payment_method,
       tax_review, use_kind, gross_cents, withholding_cents, created_at, updated_at, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      movement.id, movement.idempotencyKey, movement.kind, movement.amountCents, movement.currency,
      movement.date, movement.description, movement.categoryId, movement.paymentMethod,
      Number(movement.taxReview), movement.useKind, movement.grossCents, movement.withholdingCents,
      movement.createdAt, movement.updatedAt, movement.deletedAt);
  }
}
