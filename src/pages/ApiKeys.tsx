import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ApiKeyGenerator } from '@/components/ApiKeyGenerator';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertCircle,
    ChevronLeft,
    Key,
    Shield,
    Smartphone,
} from 'lucide-react';

export function ApiKeys() {
    const navigate = useNavigate();
    const { apiKey } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Check if user has API key stored
        if (!apiKey) {
            setIsAuthorized(false);
        } else {
            setIsAuthorized(true);
        }
    }, [apiKey]);

    const handleLogout = () => {
        localStorage.removeItem('apiKey');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="container mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/')}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                                    <Key className="h-7 w-7 text-blue-600" />
                                    API Keys
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Manage your API keys for different devices
                                </p>
                            </div>
                        </div>
                        {isAuthorized && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="text-red-600 hover:text-red-700"
                            >
                                Logout
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                {!isAuthorized ? (
                    <div className="space-y-6">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                You need to authenticate with an API key to
                                manage your keys.
                            </AlertDescription>
                        </Alert>

                        <Card>
                            <CardHeader>
                                <CardTitle>Authenticate</CardTitle>
                                <CardDescription>
                                    Enter your API key to access the key
                                    management interface
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <input
                                        type="password"
                                        placeholder="Enter your API key..."
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                const key = (
                                                    e.target as HTMLInputElement
                                                ).value;
                                                localStorage.setItem(
                                                    'apiKey',
                                                    key
                                                );
                                                window.location.reload();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={() => {
                                            const input =
                                                document.querySelector(
                                                    'input[type="password"]'
                                                ) as HTMLInputElement;
                                            if (input?.value) {
                                                localStorage.setItem(
                                                    'apiKey',
                                                    input.value
                                                );
                                                window.location.reload();
                                            }
                                        }}
                                        className="w-full"
                                    >
                                        Authenticate
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Info Cards */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Shield className="h-5 w-5 text-blue-600" />
                                        Security First
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-gray-600">
                                    <p>
                                        Each API key is unique and can be
                                        managed independently. Keep your keys
                                        secure and rotate them regularly.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Smartphone className="h-5 w-5 text-green-600" />
                                        Multi-Device
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-gray-600">
                                    <p>
                                        Generate different keys for different
                                        devices and track their usage
                                        separately.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* API Key Management */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Manage Your Keys</CardTitle>
                                <CardDescription>
                                    Generate, view, and manage all your API keys
                                    for different devices and applications
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ApiKeyGenerator currentApiKey={apiKey} />
                            </CardContent>
                        </Card>

                        {/* Best Practices */}
                        <Card className="border-amber-200 bg-amber-50">
                            <CardHeader>
                                <CardTitle className="text-amber-900">
                                    Best Practices
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-amber-900">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-900"></span>
                                        <span>
                                            <strong>
                                                Never share your API keys
                                            </strong>{' '}
                                            in public repositories, emails, or
                                            unsecured channels
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-900"></span>
                                        <span>
                                            <strong>
                                                Use separate keys for different
                                                environments
                                            </strong>{' '}
                                            (dev, staging, production)
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-900"></span>
                                        <span>
                                            <strong>
                                                Rotate keys regularly
                                            </strong>{' '}
                                            and deactivate old ones you no
                                            longer need
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-900"></span>
                                        <span>
                                            <strong>Monitor key usage</strong>{' '}
                                            and deactivate keys from compromised
                                            devices immediately
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-900"></span>
                                        <span>
                                            <strong>Save keys securely</strong>{' '}
                                            using environment variables or
                                            secure credential managers
                                        </span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
