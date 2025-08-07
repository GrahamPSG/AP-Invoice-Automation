import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Scenario } from './scenario.entity'
import { CreateScenarioDto } from './dto/create-scenario.dto'
import { ScenarioComputeService } from './scenario-compute.service'
import { ProjectsService } from '../projects/projects.service'

@Injectable()
export class ScenariosService {
  constructor(
    @InjectRepository(Scenario)
    private scenariosRepository: Repository<Scenario>,
    private scenarioComputeService: ScenarioComputeService,
    private projectsService: ProjectsService,
  ) {}

  async findAll(userId: string, includePublic = true): Promise<Scenario[]> {
    const whereConditions = includePublic
      ? [{ ownerId: userId }, { isPublic: true }]
      : [{ ownerId: userId }]

    return this.scenariosRepository.find({
      where: whereConditions,
      relations: ['owner', 'project'],
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(id: string, userId: string): Promise<Scenario | null> {
    const scenario = await this.scenariosRepository.findOne({
      where: { id },
      relations: ['owner', 'project'],
    })

    if (!scenario) {
      return null
    }

    // Check access rights
    if (scenario.ownerId !== userId && !scenario.isPublic) {
      throw new NotFoundException('Scenario not found')
    }

    return scenario
  }

  async create(
    createScenarioDto: CreateScenarioDto,
    ownerId: string,
  ): Promise<Scenario> {
    // Get base project if provided
    let baseProject = null
    if (createScenarioDto.projectId) {
      baseProject = await this.projectsService.findOne(createScenarioDto.projectId)
      if (!baseProject) {
        throw new NotFoundException('Base project not found')
      }
    }

    // Compute scenario outputs
    const inputs = {
      projectSize: createScenarioDto.projectSize,
      scope: createScenarioDto.scope,
      crewChange: createScenarioDto.crewChange,
      scheduleChangeWeeks: createScenarioDto.scheduleChangeWeeks,
      overheadChangePct: createScenarioDto.overheadChangePct,
      materialInflationPct: createScenarioDto.materialInflationPct,
      laborRateChangePct: createScenarioDto.laborRateChangePct,
      targetProfitPct: createScenarioDto.targetProfitPct,
    }

    const outputs = this.scenarioComputeService.computeScenario(inputs, baseProject)

    const scenario = this.scenariosRepository.create({
      projectId: createScenarioDto.projectId,
      ownerId,
      isPublic: createScenarioDto.isPublic || false,
      inputs,
      outputs,
    })

    return this.scenariosRepository.save(scenario)
  }

  async update(
    id: string,
    updateData: Partial<CreateScenarioDto>,
    userId: string,
  ): Promise<Scenario> {
    const scenario = await this.findOne(id, userId)
    if (!scenario) {
      throw new NotFoundException('Scenario not found')
    }

    // Only owner can update
    if (scenario.ownerId !== userId) {
      throw new NotFoundException('Scenario not found')
    }

    // Get base project if needed
    let baseProject = null
    if (scenario.projectId) {
      baseProject = await this.projectsService.findOne(scenario.projectId)
    }

    // Recompute with updated inputs
    const updatedInputs = {
      ...scenario.inputs,
      ...updateData,
    }

    const outputs = this.scenarioComputeService.computeScenario(updatedInputs, baseProject)

    await this.scenariosRepository.update(id, {
      inputs: updatedInputs,
      outputs,
      isPublic: updateData.isPublic ?? scenario.isPublic,
    })

    return this.findOne(id, userId)
  }

  async delete(id: string, userId: string): Promise<void> {
    const scenario = await this.findOne(id, userId)
    if (!scenario) {
      throw new NotFoundException('Scenario not found')
    }

    // Only owner can delete
    if (scenario.ownerId !== userId) {
      throw new NotFoundException('Scenario not found')
    }

    await this.scenariosRepository.delete(id)
  }
}