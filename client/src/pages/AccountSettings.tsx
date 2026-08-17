import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function AccountSettings() {
  const [, navigate] = useLocation();

  // Email change state
  const [emailData, setEmailData] = useState({
    currentPassword: "",
    newEmail: "",
    showPassword: false,
  });
  const [emailMessage, setEmailMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const emailMutation = trpc.auth.updateEmail.useMutation();

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const passwordMutation = trpc.auth.updatePassword.useMutation();

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);

    if (!emailData.currentPassword || !emailData.newEmail) {
      setEmailMessage({
        type: "error",
        text: "Preencha todos os campos",
      });
      return;
    }

    try {
      const result = await emailMutation.mutateAsync({
        currentPassword: emailData.currentPassword,
        newEmail: emailData.newEmail,
      });

      if (result.success) {
        setEmailMessage({
          type: "success",
          text: "Email alterado com sucesso!",
        });
        setEmailData({
          currentPassword: "",
          newEmail: "",
          showPassword: false,
        });
        // Refresh after 2 seconds
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setEmailMessage({
          type: "error",
          text: result.error || "Erro ao alterar email",
        });
      }
    } catch (error) {
      setEmailMessage({
        type: "error",
        text: "Erro ao alterar email",
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordMessage({
        type: "error",
        text: "Preencha todos os campos",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "As senhas não coincidem",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "A nova senha deve ter pelo menos 8 caracteres",
      });
      return;
    }

    try {
      const result = await passwordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (result.success) {
        setPasswordMessage({
          type: "success",
          text: "Senha alterada com sucesso! Você será desconectado.",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          showCurrent: false,
          showNew: false,
          showConfirm: false,
        });
        // Redirect to login after 2 seconds
        setTimeout(() => navigate("/admin/login"), 2000);
      } else {
        setPasswordMessage({
          type: "error",
          text: result.error || "Erro ao alterar senha",
        });
      }
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: "Erro ao alterar senha",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configurações de Conta
          </h1>
          <p className="text-gray-600">
            Gerencie suas credenciais de acesso com segurança
          </p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Alterar Email</TabsTrigger>
            <TabsTrigger value="password">Alterar Senha</TabsTrigger>
          </TabsList>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card className="p-6">
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <Input
                      type={emailData.showPassword ? "text" : "password"}
                      placeholder="Digite sua senha atual"
                      value={emailData.currentPassword}
                      onChange={(e) =>
                        setEmailData({
                          ...emailData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEmailData({
                          ...emailData,
                          showPassword: !emailData.showPassword,
                        })
                      }
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      {emailData.showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Novo Email
                  </label>
                  <Input
                    type="email"
                    placeholder="seu-novo@email.com"
                    value={emailData.newEmail}
                    onChange={(e) =>
                      setEmailData({ ...emailData, newEmail: e.target.value })
                    }
                  />
                </div>

                {emailMessage && (
                  <Alert
                    className={
                      emailMessage.type === "success"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }
                  >
                    {emailMessage.type === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription
                      className={
                        emailMessage.type === "success"
                          ? "text-green-800"
                          : "text-red-800"
                      }
                    >
                      {emailMessage.text}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={emailMutation.isPending}
                  className="w-full bg-pink-500 hover:bg-pink-600"
                >
                  {emailMutation.isPending ? "Atualizando..." : "Alterar Email"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-6">
            <Card className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <Input
                      type={passwordData.showCurrent ? "text" : "password"}
                      placeholder="Digite sua senha atual"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPasswordData({
                          ...passwordData,
                          showCurrent: !passwordData.showCurrent,
                        })
                      }
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      {passwordData.showCurrent ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Input
                      type={passwordData.showNew ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPasswordData({
                          ...passwordData,
                          showNew: !passwordData.showNew,
                        })
                      }
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      {passwordData.showNew ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Input
                      type={passwordData.showConfirm ? "text" : "password"}
                      placeholder="Confirme a nova senha"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPasswordData({
                          ...passwordData,
                          showConfirm: !passwordData.showConfirm,
                        })
                      }
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      {passwordData.showConfirm ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {passwordMessage && (
                  <Alert
                    className={
                      passwordMessage.type === "success"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }
                  >
                    {passwordMessage.type === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription
                      className={
                        passwordMessage.type === "success"
                          ? "text-green-800"
                          : "text-red-800"
                      }
                    >
                      {passwordMessage.text}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={passwordMutation.isPending}
                  className="w-full bg-pink-500 hover:bg-pink-600"
                >
                  {passwordMutation.isPending
                    ? "Atualizando..."
                    : "Alterar Senha"}
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => navigate("/admin")}
            className="w-full"
          >
            Voltar ao Painel Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
