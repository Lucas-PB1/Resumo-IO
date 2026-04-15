"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { User, Upload, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { storage } from "@/lib/firebase/storage";
import { userService, UserProfileData } from "../services/user.service";
import { useAuth } from "@/features/auth/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const ProfileEditForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successStatus, setSuccessStatus] = useState("");
  const [errorStatus, setErrorStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<Partial<UserProfileData>>();
  const currentPhotoURL = watch("photoURL");

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const profile = await userService.getUserProfile(user.uid);
        if (profile) {
          reset(profile);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user, reset]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setErrorStatus("Por favor, selecione apenas imagens.");
      return;
    }

    try {
      setUploadingImage(true);
      setErrorStatus("");
      setSuccessStatus("");
      
      const storageRef = ref(storage, `users/${user.uid}/avatar_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setValue("photoURL", downloadURL, { shouldDirty: true });
      await onSubmit({ photoURL: downloadURL }); // Auto-save on upload
      setSuccessStatus("Avatar atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      setErrorStatus("Erro ao fazer upload da imagem.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: Partial<UserProfileData>) => {
    if (!user) return;
    try {
      setSuccessStatus("");
      setErrorStatus("");
      await userService.updateUserProfile(user.uid, {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        gender: data.gender,
        photoURL: data.photoURL,
      });
      setSuccessStatus("Perfil atualizado com sucesso!");
    } catch (err: any) {
      setErrorStatus("Erro ao atualizar o perfil");
    }
  };

  if (loading) return <div className="text-center p-8">Carregando...</div>;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary border-2 border-transparent group-hover:border-primary transition-all">
              {currentPhotoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentPhotoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={32} />
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <span className="animate-spin text-primary">⏳</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1 rounded-full shadow-md">
              <Upload size={12} />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>
          <div>
            <CardTitle className="text-xl">Opções de Conta</CardTitle>
            <CardDescription>Atualize suas informações pessoais e sua foto de perfil via Firebase Storage.</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4">
            Nota: Para redefinir e-mail ou senha, por favor utilize os fluxos de segurança do sistema.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input id="firstName" {...register("firstName", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input id="lastName" {...register("lastName", { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input id="birthDate" type="date" {...register("birthDate", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Select id="gender" {...register("gender")}>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
                <option value="OUTRO">Outro</option>
                <option value="PREFIRO_NAO_DIZER">Prefiro não dizer</option>
              </Select>
            </div>
          </div>

          {errorStatus && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
              {errorStatus}
            </div>
          )}
          {successStatus && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
              {successStatus}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" isLoading={isSubmitting || uploadingImage}>
            Salvar Alterações
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
