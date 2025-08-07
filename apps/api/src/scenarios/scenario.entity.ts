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
import { Project } from '../projects/project.entity'

@Entity('scenarios')
export class Scenario {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: true })
  projectId?: string

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project?: Project

  @Column()
  ownerId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User

  @Column({ default: false })
  isPublic: boolean

  @Column({ type: 'jsonb' })
  inputs: {
    projectSize: { units?: number; dollars?: number; sqFt?: number }
    scope: ('plumbing' | 'hvac' | 'combined')[]
    crewChange: number
    scheduleChangeWeeks: number
    overheadChangePct?: number
    materialInflationPct?: number
    laborRateChangePct?: number
    targetProfitPct?: number
  }

  @Column({ type: 'jsonb' })
  outputs: {
    totalRevenue: number
    totalCost: number
    grossMarginPct: number
    laborHours: number
    laborPerUnit: number
    profitDollars: number
    profitPct: number
    cashFlowForecast: Array<{ week: number; cash: number }>
    alerts: Array<{ message: string; severity: 'info' | 'warning' | 'critical' }>
  }

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}