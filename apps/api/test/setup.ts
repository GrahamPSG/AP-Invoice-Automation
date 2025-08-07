import { Test } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'

export const createTestingModule = async (modules: any[]) => {
  return Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      ...modules,
    ],
  }).compile()
}