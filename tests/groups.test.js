import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GroupsPage from '../src/app/groups/page';
import { api } from '../src/lib/api';

jest.mock('../src/lib/api', () => ({
  api: { groups: { list: jest.fn(), listPublic: jest.fn(), create: jest.fn() } },
}));

beforeEach(() => {
  jest.clearAllMocks();
  const groups = [
    { id: 'limited', title: 'Study together', is_public: true, member_count: 8, max_members: 20 },
    { id: 'unlimited', title: 'Open study', is_public: true, member_count: 12, max_members: null },
  ];
  api.groups.list.mockResolvedValue({ success: true, data: { groups } });
  api.groups.listPublic.mockResolvedValue({ success: true, data: { groups } });
  api.groups.create.mockResolvedValue({ success: true });
});

test('shows counts and limits on both group lists', async () => {
  render(<GroupsPage />);
  expect(await screen.findByText('8 / 20 members')).toBeInTheDocument();
  expect(screen.getByText('12 members · No limit')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /public study groups/i }));
  expect(screen.getByText('8 / 20 members')).toBeInTheDocument();
  expect(screen.getByText('12 members · No limit')).toBeInTheDocument();
});

test.each([['6', 6], ['', null]])('creates a group with maximum members %s', async (input, expected) => {
  render(<GroupsPage />);
  await screen.findByText('8 / 20 members');
  fireEvent.click(screen.getByRole('button', { name: '+ Create Group' }));
  const limit = screen.getByLabelText('Maximum members');
  expect(limit).toHaveValue(20);
  fireEvent.change(screen.getByLabelText('Course / Group Title'), { target: { value: 'My study group' } });
  fireEvent.change(limit, { target: { value: input } });
  fireEvent.click(screen.getByRole('button', { name: 'Create Group', exact: true }));
  await waitFor(() => expect(api.groups.create).toHaveBeenCalledWith({
    title: 'My study group', description: '', is_public: true, max_members: expected,
  }));
});
