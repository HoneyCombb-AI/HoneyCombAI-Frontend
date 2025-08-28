import Image from 'next/image';

interface RingStateProps {
    green: boolean;
    golden: boolean;
    requested: boolean;
    profilePicture: string | null;
    fullName: string;
}

export function RingState({ green, golden, requested, profilePicture, fullName }: RingStateProps) {
    // Determine which ring to show based on priority
    if (requested) {
        // Loading state for analysis requested
        return (
            <div className="contact-ring-wrapper" data-testid="sample-contact-loading-ring">
                <div className="contact-ring-shape contact-quarter-split"></div>
                <div className="contact-ring-image">
                    {profilePicture ? (
                        <Image
                            src={profilePicture}
                            alt={fullName}
                            fill
                            sizes="120px"
                            quality={100}
                            className="object-cover rounded-full"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium rounded-full">
                            {fullName.charAt(0)}
                        </div>
                    )}
                </div>
            </div>
        );
    } else if (golden && green) {
        // Split ring for both tracked and analysis completed
        return (
            <div className="contact-ring-wrapper" data-testid="sample-contact-split-ring">
                <div className="contact-ring-shape contact-split-ring"></div>
                <div className="contact-ring-image">
                    {profilePicture ? (
                        <Image
                            src={profilePicture}
                            alt={fullName}
                            fill
                            sizes="120px"
                            quality={100}
                            className="object-cover rounded-full"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium rounded-full">
                            {fullName.charAt(0)}
                        </div>
                    )}
                </div>
            </div>
        );
    } else if (green) {
        // Green ring for analysis completed only
        return (
            <div className="contact-ring-wrapper" data-testid="sample-contact-green-ring">
                <div className="contact-ring-shape contact-full-ring-green"></div>
                <div className="contact-ring-image">
                    {profilePicture ? (
                        <Image
                            src={profilePicture}
                            alt={fullName}
                            fill
                            sizes="120px"
                            quality={100}
                            className="object-cover rounded-full"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium rounded-full">
                            {fullName.charAt(0)}
                        </div>
                    )}
                </div>
            </div>
        );
    } else if (golden) {
        // Golden ring for tracked only
        return (
            <div className="contact-ring-wrapper" data-testid="sample-contact-golden-ring">
                <div className="contact-ring-shape contact-full-ring-gold"></div>
                <div className="contact-ring-image">
                    {profilePicture ? (
                        <Image
                            src={profilePicture}
                            alt={fullName}
                            fill
                            sizes="120px"
                            quality={100}
                            className="object-cover rounded-full"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium rounded-full">
                            {fullName.charAt(0)}
                        </div>
                    )}
                </div>
            </div>
        );
    } else {
        // No ring
        return (
            <div className="w-8 h-8 rounded-full overflow-hidden relative" data-testid="sample-contact-no-ring">
                {profilePicture ? (
                    <Image
                        src={profilePicture}
                        alt={fullName}
                        fill
                        sizes="120px"
                        quality={100}
                        className="object-cover rounded-full"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium rounded-full">
                        {fullName.charAt(0)}
                    </div>
                )}
            </div>
        );
    }
}