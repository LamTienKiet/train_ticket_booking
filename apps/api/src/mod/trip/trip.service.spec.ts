import { Test, TestingModule } from '@nestjs/testing';
import { TripService } from './trip.service';

describe('TripService', () => {
  let service: TripService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TripService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get<TripService>(TripService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
