import {db} from "../db/index.js";
import { Teacher } from "../db/schema.js";
import { Grade ,GradeSession} from "../db/schema.js";
import { sql } from "drizzle-orm";
import { User } from "../db/schema.js";
import {createGradeSession} from "./gradeSession.js";
import { RoleEnums } from  "../db/schema.js";
import { TeacherTypeEnum } from "../db/schema.js";
import { wantsPagination, parsePagination, buildPaginationMeta } from "../lib/pagination.js";
import {Schedule ,Seance} from "../db/schema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { eq, ne, gt, gte ,and,isNull} from "drizzle-orm";
config();


export const getTeachers = async (req, res) => {
    try {
        const filters = [];

        if (req.query.gradeId !== undefined) {
            const gradeId = Number(req.query.gradeId);
            if (!Number.isInteger(gradeId)) {
                return res.status(400).json({ error: "gradeId must be an integer" });
            }
            filters.push(eq(Teacher.gradeId, gradeId));
        }

        if (req.query.teacherType !== undefined) {
            const teacherType = String(req.query.teacherType);
            if (!TeacherTypeEnum.enumValues.includes(teacherType)) {
                return res.status(400).json({
                    error: `teacherType must be one of: ${TeacherTypeEnum.enumValues.join(", ")}`,
                });
            }
            filters.push(eq(Teacher.teacherType, teacherType));
        }

        if (req.query.search !== undefined && String(req.query.search).trim() !== "") {
            const term = `%${String(req.query.search).trim()}%`;
            filters.push(
                sql`(${User.firstName} ILIKE ${term} OR ${User.lastName} ILIKE ${term} OR ${User.email} ILIKE ${term})`
            );
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        const teachersQuery = () =>
            db
                .select()
                .from(Teacher)
                .innerJoin(User, eq(User.id, Teacher.id))
                .innerJoin(Grade, eq(Grade.id, Teacher.gradeId));

        // No filters and no pagination requested => keep the historical shape
        // (a bare array) so existing clients keep working.
        if (!wantsPagination(req.query) && !whereClause) {
            const teachers = await teachersQuery();
            return res.status(200).json(teachers);
        }

        const { page, limit, offset } = parsePagination(req.query);

        let query = teachersQuery();
        if (whereClause) query = query.where(whereClause);
        const teachers = await query.limit(limit).offset(offset);

        let countQuery = db
            .select({ count: sql`count(*)::int` })
            .from(Teacher)
            .innerJoin(User, eq(User.id, Teacher.id));
        if (whereClause) countQuery = countQuery.where(whereClause);
        const [{ count: total }] = await countQuery;

        return res.status(200).json({
            teachers,
            pagination: buildPaginationMeta({ page, limit, offset }, total, teachers.length),
        });
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await db.select().from(Teacher).innerJoin(User, eq(User.id,Teacher.id)).innerJoin(Grade, eq(Grade.id,Teacher.gradeId)).where(sql`${Teacher.id} = ${id}`);
        if (teacher.length === 0) {
            return res.status(404).json({ error: "Teacher not found" });
        }
        return res.status(200).json(teacher[0]);
    } catch (error) {
        console.error("Error fetching teacher:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await db.delete(Teacher).where(sql`${Teacher.id} = ${id}`);
        // Delete the user associated with the teacher
        await db.delete(User).where(sql`${User.id} = ${id}`);
        return res.status(200).json({ message: "Teacher deleted successfully" });
    } catch (error) {
        console.error("Error deleting teacher:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const updateTeacher = async (req, res) => {
    try {
        const { id, firstName, lastName, email, role, gradeId,teacherType } = req.body;

        // Check if the user exists
        const existingUser = await db.select().from(User).where(sql`${User.id} = ${id}`);
        if (existingUser.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the grade ID is valid
        const validGradeIds = await db.select().from(Grade).where(sql`${Grade.id} = ${gradeId}`);
        if (validGradeIds.length === 0) {
            return res.status(400).json({ error: "Invalid grade ID" });
        }
        // Check if the role is valid
        const validRoles = Object.values(RoleEnums.enumValues);
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        // Update the user
        await db.update(User).set({
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: role,
        }).where(sql`${User.id} = ${id}`);
        // Update the teacher
        await db.update(Teacher).set({
            gradeId: gradeId,
            teacherType: teacherType,
        }).where(sql`${Teacher.id} = ${id}`);
        // if grade is changed, update the grade sessions
        if (existingUser[0].gradeId !== gradeId) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 1);

            const parsedStartDate = new Date(Date.UTC(
                startDate.getUTCFullYear(),
                startDate.getUTCMonth(),
                startDate.getUTCDate()
            ));            console.log(parsedStartDate)
            const teacherId = id; // Assuming id is the teacher's ID
                // Find any existing open session for this teacher (with null finishDate)
                const existingOpenSessions = await db
                  .select()
                  .from(GradeSession)
                  .where(
                    and(
                      eq(GradeSession.teacherId, teacherId),
                      isNull(GradeSession.finishDate)
                    )
                  );
                
                // Close any open sessions as of the day before the new session starts
                if (existingOpenSessions.length > 0) {
                    const previousDay = new Date(parsedStartDate);
                    previousDay.setDate(previousDay.getDate() - 1);
                  
                  for (const session of existingOpenSessions) {
                    await db
                      .update(GradeSession)
                      .set({ finishDate: reviousDay.toISOString().split('T')[0] })
                      .where(eq(GradeSession.id, session.id));
                  }
                }
                
                // Create new session
                const newSession = await db
                  .insert(GradeSession)
                  .values({
                    teacherId: teacherId,
                    gradeId: gradeId,
                    startDate: parsedStartDate.toISOString().split('T')[0],
                    finishDate: null  // Open-ended session
                  })
                  .returning();
                
                // Update teacher's current grade
                await db
                  .update(Teacher)
                  .set({ gradeId: gradeId })
                  .where(eq(Teacher.id, teacherId));
                  
        }
        return res.status(200).json({ message: "Teacher updated successfully" });
    } catch (error) {
        console.error("Error updating teacher:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getTeacherPlanning = async (req, res) => {
    const {educationalYear,id} = req.params;
    if (!educationalYear){
        return res.status(400).json({
            error:"EducationYear is required , format yyyy/yyyy"
        })
    }
    // get all schedules 
    const schedules = await db.select().from(Schedule).where(eq(Schedule.educationalYear,educationalYear))
    if (schedules.length === 0) {
        return res.status(404).json({
            error: "No schedules found for the given educational year"
        });
    }
   
    // get all seances of the array schedules of the teacher
    const seances = await db.select().from(Seance).where(
        sql`${Seance.teacherId} = ${id} AND ${Seance.scheduleID} IN (${schedules.map(schedule => schedule.id)})`
    );
    if (seances.length === 0) {
        return res.status(404).json({
            error: "No seances found for the given teacher and educational year"
        });
    }
    const heuresupHours = seances.reduce((acc, seance) => acc + (seance.heureSupDuration || 0), 0);
    return res.status(200).json({
        seances: seances,
        heuresupHours: heuresupHours
    });



}

