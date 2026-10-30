import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JqwidgetTestComponent } from './jqwidget-test.component';

describe('JqwidgetTestComponent', () => {
  let component: JqwidgetTestComponent;
  let fixture: ComponentFixture<JqwidgetTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JqwidgetTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JqwidgetTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
