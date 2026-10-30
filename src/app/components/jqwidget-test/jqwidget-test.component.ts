import { Component } from '@angular/core';
import { jqxGridComponent } from 'jqwidgets-ng/jqxgrid';
import { jqxGridModule } from 'jqwidgets-ng/jqxgrid';

@Component({
  selector: 'app-jqwidget-test',
  imports: [jqxGridModule],
  templateUrl: './jqwidget-test.component.html',
  styleUrl: './jqwidget-test.component.css',
  standalone: true,
})
export class JqwidgetTestComponent {
  gridReference!: jqxGridComponent;

  source: any = {
    localdata: Array.from({ length: 200 }, (_, index) => ({
      id: index + 1,
      name: `Employee ${index + 1}`,
      department: ['IT', 'HR', 'Finance', 'Sales'][index % 4],
      designation: ['Developer', 'Manager', 'Analyst', 'Team Lead'][index % 4],
      email: `employee${index + 1}@company.com`,
      city: ['Mumbai', 'Pune', 'Nagpur', 'Delhi'][index % 4],
      salary: 30000 + index * 1500,
      status: index % 2 === 0 ? 'Active' : 'Inactive',
    })),

    datatype: 'array',

    datafields: [
      { name: 'id', type: 'number' },
      { name: 'name', type: 'string' },
      { name: 'department', type: 'string' },
      { name: 'designation', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'city', type: 'string' },
      { name: 'salary', type: 'number' },
      { name: 'status', type: 'string' },
    ],
  };

  columns: any[] = [
    { text: 'ID', datafield: 'id', width: 500 },
    { text: 'Employee Name', datafield: 'name', width: 700 },
    { text: 'Department', datafield: 'department', width: 800 },
    { text: 'Designation', datafield: 'designation', width: 130 },
    { text: 'Email', datafield: 'email', width: 200 },
    { text: 'City', datafield: 'city', width: 110 },
    { text: 'Salary', datafield: 'salary', width: 120 },
    { text: 'Status', datafield: 'status', width: 100 },
  ];
  dataAdapter: any = new (window as any).jqx.dataAdapter(this.source);
}
