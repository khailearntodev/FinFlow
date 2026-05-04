'use client';

import { CreateFamilyForm } from '@/components/CreateFamilyForm';

export default function CreateFamilyPage() {
  return <CreateFamilyForm redirectOnSuccess="/family" />;
}
