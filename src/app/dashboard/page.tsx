"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import "./dashboard.css";

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([]); // Can replace with interface
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState("");
  const [_userId, setUserId] = useState<string | null>(null); // Used underscore to suppress warning
  const [ownClassId, setOwnClassId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const router = useRouter();

  const fetchStudents = async (classId: string) => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", classId);

    if (error) {
      alert("Failed to load students: " + error.message);
      return;
    }

    setStudents(data || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        router.push("/login");
        return;
      }

      const user = session.user;
      setUserId(user.id); // Even though unused, now won’t trigger ESLint error

      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id, class_id")
        .eq("auth_user_id", user.id)
        .single();

      if (teacherError || !teacherData) {
        alert("Teacher not found");
        return;
      }

      setOwnClassId(teacherData.class_id);
      setSelectedClassId(teacherData.class_id);

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("*");

      if (classError) {
        alert("Failed to load classes: " + classError.message);
        return;
      }

      setClasses(classData || []);
      fetchStudents(teacherData.class_id);
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
    }
  }, [selectedClassId]);

  const addStudent = async () => {
    if (!ownClassId || !newStudent.trim()) {
      alert("Missing student name");
      return;
    }

    const { error } = await supabase.from("students").insert({
      name: newStudent,
      class_id: ownClassId,
    });

    if (error) {
      alert(error.message);
    } else {
      setNewStudent("");
      if (selectedClassId === ownClassId) {
        await fetchStudents(ownClassId);
      }
    }
  };

  const deleteStudent = async (id: string) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      alert("Failed to delete student: " + error.message);
    } else {
      setStudents(students.filter((s) => s.id !== id));
    }
  };

  const updateStudent = async () => {
    if (!editingId || !editedName.trim()) return;

    const { error } = await supabase
      .from("students")
      .update({ name: editedName })
      .eq("id", editingId);

    if (error) {
      alert("Failed to update student: " + error.message);
    } else {
      setEditingId(null);
      setEditedName("");
      if (ownClassId) {
        await fetchStudents(ownClassId);
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Teacher Dashboard</h1>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="mb-4 w-full flex flex-wrap items-center gap-2">
          {selectedClassId === ownClassId && (
            <>
              <input
                placeholder="New Student Name"
                value={newStudent}
                onChange={(e) => setNewStudent(e.target.value)}
                className="input-field"
              />
              <button onClick={addStudent} className="add-btn">
                Add
              </button>
            </>
          )}

          <select
            value={selectedClassId || ""}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="select-dropdown"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.id.slice(0, 6)}
              </option>
            ))}
          </select>
        </div>

        {students.length > 0 ? (
          <table className="w-full mt-6 text-left table-auto">
            <colgroup>
              <col style={{ width: "80%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-300">
                <th className="px-4 py-2">Student Name</th>
                {selectedClassId === ownClassId && (
                  <th className="px-4 py-2 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-2">
                    {editingId === student.id ? (
                      <input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="border px-2 py-1 w-full"
                      />
                    ) : (
                      student.name
                    )}
                  </td>
                  {selectedClassId === ownClassId && (
                    <td className="px-4 py-2 text-right">
                      {editingId === student.id ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={updateStudent}
                            className="bg-blue-500 text-white px-3 py-1 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditedName("");
                            }}
                            className="bg-gray-300 text-black px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingId(student.id);
                              setEditedName(student.name);
                            }}
                            className="edit-btn"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteStudent(student.id)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-4 text-gray-600 text-center">
            No students found for this class.
          </p>
        )}
      </div>
    </div>
  );
}
