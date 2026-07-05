'use client';
import GroupAssignment from "../components/GroupAssignment";
import UserNav from "../components/UseNav";
import Link from "next/link"
import { useSupabase } from '../lib/supabaseClient'
import { useUser  } from "@clerk/nextjs";
import {useEffect, useState} from 'react'

const arr = [1, 2, 3, 4, 5]

export default function Home() {
const [projectsData, setProjectsData] = useState<any[]>([]);

  const supabase = useSupabase()
  const { user } = useUser();

    useEffect(() => {
      const fetchProjects = async () => {
        const {data, error} =  await supabase.from('projects').select()

        if(error) {
        console.error(error);
        }
        setProjectsData(data || []);
      }
      fetchProjects()
    }, [])

  useEffect(() => {
  if (!user) {
    console.log("User not logged in");
    // optional: router.push("/sign-in")
  }
  }, [user]);

  async function handleDelete(id: string) {
    const response =  await supabase.from('projects').delete().eq('id', id)
    const fetchProjects = async () => {
        const {data, error} =  await supabase.from('projects').select()

        if(error) {
        console.error(error);
        }
        setProjectsData(data || []);
      }
      fetchProjects()
  }

  projectsData.sort((a, b)  => new Date(a["due_date"]).getTime() - new Date(b["due_date"]).getTime())
  const groupAssElements = projectsData.map((ass) => {
    return <GroupAssignment key={ass["id"]} id={ass["id"]} assignmentName = {ass["project_name"]} dueDate = {ass["due_date"]} handleDelete = {handleDelete}/>;
  });

  return (
    <main className="min-h-screen bg-[#0B0817] text-slate-100">
      <nav className="flex items-center justify-between border-b border-[#2C2650] px-6 py-4">
        <div>
          <p className="text-lg font-semibold tracking-tight">Group Project Manager</p>
          <p className="text-sm text-slate-400">
            Keep your team aligned and moving forward.
          </p>
        </div>

        <UserNav />
      </nav>

<section className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-20">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Plan projects, assign work, and ship with confidence.
          </h1>
        </div>
      </section>

      <div className="flex justify-center pb-10">
        <Link
          href="/add-group-assignment"
          className="flex h-14 w-80 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B6FFF] to-[#6a4ee0] text-lg font-semibold font-geist-mono text-white shadow-lg shadow-[#8B6FFF]/30 transition-transform hover:scale-[1.02]"
        >
          Add New Group Assignment
      </Link>
      </div>
      {groupAssElements}
    </main>
  );
}