import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from '../users/user.entity'

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sizeUnits?: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sizeSqFt?: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sizeDollars?: number

  @Column({
    type: 'enum',
    enum: ['plumbing', 'hvac', 'combined'],
  })
  scope: 'plumbing' | 'hvac' | 'combined'

  @Column({ type: 'int' })
  durationWeeks: number

  @Column({ type: 'jsonb' })
  costs: {
    labor: number
    materials: number
    equipment: number
    overhead: number
    profit: number
  }

  @Column({ type: 'int' })
  crewSize: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  revenuePerTechDay: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  grossProfit: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netProfit: number

  @Column({ type: 'jsonb', nullable: true })
  cashFlow?: Array<{ week: number; cash: number }>

  @Column({ type: 'jsonb' })
  columnMap: Record<string, string>

  @Column()
  uploadedBy: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedBy' })
  uploader: User

  @Column({ nullable: true })
  filePath?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}