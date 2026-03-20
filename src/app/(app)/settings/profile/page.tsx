import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/settings/ProfileForm'

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { email: session.user.email } })

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Profile</h1>
      <div className="max-w-2xl">
        <ProfileForm
          initialFullName={profile?.fullName ?? ''}
          initialAvatarUrl={profile?.avatarUrl ?? ''}
          email={session.user.email}
        />
      </div>
    </div>
  )
}
