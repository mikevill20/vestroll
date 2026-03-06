import { db } from "../db"; 
import { organizations, users, employees, milestones } from "../db/schema";

async function seed() {
  const org = await db.insert(organizations).values({
    name: "Vestroll Inc",
    industry: "Fintech",
  }).returning();

  const user = await db.insert(users).values({
    firstName: "Samix",
    lastName: "Yasuke",
    email: "samix@vestroll.com",
    role: "admin",
    organizationId: org[0].id,
  }).returning();

  const employee = await db.insert(employees).values({
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@vestroll.com",
    role: "Developer",
    department: "Engineering",
    type: "Contractor",            
    status: "Active",               
    organizationId: org[0].id,
    userId: user[0].id,
  }).returning();

  await db.insert(milestones).values({
    milestoneName: "Build MVP Backend",
    amount: 5000,
    dueDate: new Date("2026-03-31T23:59:59Z"),
    status: "pending",              
    employeeId: employee[0].id,
  });

  console.log("Database seeded successfully with milestone!");
  process.exit(0);
}

seed();