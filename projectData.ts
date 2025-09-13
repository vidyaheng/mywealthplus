import mongoose, { Schema, Document } from 'mongoose';

// กำหนดชนิดของข้อมูลที่จะรับเข้ามา
export interface IProjectData extends Document {
  pin: string;
  projectName: 'iWealthy' | 'LTHC' | 'CI'; // บังคับให้เป็นแค่ 3 ค่านี้เท่านั้น
  recordName: string;
  data: mongoose.Schema.Types.Mixed; // 'Mixed' คือสามารถเก็บ Object ที่มีโครงสร้างซับซ้อนได้
  createdAt: Date;
  updatedAt: Date;
}

const ProjectDataSchema: Schema = new Schema(
  {
    pin: {
      type: String,
      required: true, // บังคับว่าต้องมี pin
      index: true,     // ทำ index ที่ pin เพื่อให้ค้นหาได้เร็วขึ้น
    },
    projectName: {
      type: String,
      required: true, // บังคับว่าต้องมีชื่อ project
      enum: ['iWealthy', 'LTHC', 'CI'], // ค่าที่อนุญาต
    },
    recordName: { // ⭐ 2. เพิ่ม field ใน Schema
      type: String,
      required: true, // บังคับว่าต้องตั้งชื่อเสมอ
      trim: true,     // ตัดช่องว่างหน้า-หลังชื่ออัตโนมัติ
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true, // บังคับว่าต้องมีข้อมูลส่งมา
    },
  },
  {
    timestamps: true, // ให้ mongoose จัดการ field `createdAt` และ `updatedAt` อัตโนมัติ
  }
);

export default mongoose.model<IProjectData>('ProjectData', ProjectDataSchema);