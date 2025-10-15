'use client';

import StudentSidebar from '@/components/StudentSidebar';
import { useEffect, useState } from 'react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [studentName, setStudentName] = useState('학생');
  const [studentInitial, setStudentInitial] = useState('S');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (sessionData) {
      const student = JSON.parse(sessionData);
      setStudentName(student.name || '학생');
      setStudentInitial(student.name ? student.name[0] : 'S');
      setProfileImage(student.profileImage || null);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar
        studentName={studentName}
        studentInitial={studentInitial}
        profileImageUrl={profileImage}
      />
      <main className="flex-1 lg:ml-64">
        {children}
      </main>
    </div>
  );
}
