import React from 'react';
import { Card, Title, Group, Button, Table } from '@mantine/core';

const LeaveManagement = () => {
  const leaveData = [
    { id: 1, employee: 'John Doe', type: 'Annual Leave', startDate: '2024-02-01', endDate: '2024-02-05', status: 'Pending' },
    { id: 2, employee: 'Jane Smith', type: 'Sick Leave', startDate: '2024-02-03', endDate: '2024-02-04', status: 'Approved' },
    { id: 3, employee: 'Mike Johnson', type: 'Personal Leave', startDate: '2024-02-10', endDate: '2024-02-12', status: 'Rejected' },
  ];

  const rows = leaveData.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>{item.employee}</Table.Td>
      <Table.Td>{item.type}</Table.Td>
      <Table.Td>{item.startDate}</Table.Td>
      <Table.Td>{item.endDate}</Table.Td>
      <Table.Td>
        <span className={`status-${item.status.toLowerCase()}`}>{item.status}</span>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Button size="xs" variant="outline">Edit</Button>
          <Button size="xs" variant="outline" color="red">Delete</Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder className="h-screen w-full">
      <Group justify="space-between" mb="md">
        <Title order={2}>Leave Management</Title>
        <Button>New Leave Request</Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Employee</Table.Th>
            <Table.Th>Leave Type</Table.Th>
            <Table.Th>Start Date</Table.Th>
            <Table.Th>End Date</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Card>
  );
};

export default LeaveManagement;