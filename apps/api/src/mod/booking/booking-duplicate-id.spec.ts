import { findDuplicateIdNumber } from './booking.service';

describe('findDuplicateIdNumber', () => {
  it('không trùng thì trả undefined', () => {
    expect(findDuplicateIdNumber([{ idNumber: '001' }, { idNumber: '002' }])).toBeUndefined();
  });
  it('bắt trùng kể cả khác khoảng trắng / hoa thường', () => {
    expect(
      findDuplicateIdNumber([{ idNumber: 'ab 123' }, { idNumber: '999' }, { idNumber: 'AB123 ' }]),
    ).toBe('AB123');
  });
});
