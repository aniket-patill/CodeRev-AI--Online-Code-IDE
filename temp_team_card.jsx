// Team Member Card Component with Split Layout - image on top, info below
const TeamMemberCard = ({ member }) => {
    return (
        <div className="group relative h-full">
            <div className="relative h-full rounded-2xl border border-zinc-200 dark:border-white/5 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/40 dark:to-zinc-900/20 backdrop-blur-sm hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50 overflow-hidden flex flex-col">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

                {/* Top Half - Photo */}
                <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                        src={member.photo}
                        alt={member.name}
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-105"
                    />
                    {/* Gradient overlay at bottom of photo */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Status indicator */}
                    <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg">
                        <div className="w-full h-full bg-green-400 rounded-full animate-pulse" />
                    </div>
                </div>

                {/* Bottom Half - Info */}
                <div className="relative flex-1 p-6 flex flex-col">
                    {/* Name and Role */}
                    <div className="mb-3">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {member.name}
                        </h3>
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {member.role}
                        </p>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 flex-1">
                        {member.bio}
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center gap-2 pt-4 border-t border-zinc-200 dark:border-white/10">
                        {member.github && (
                            <a
                                href={member.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-300 hover:scale-110"
                            >
                                <Github className="w-4 h-4" />
                            </a>
                        )}
                        {member.linkedin && (
                            <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-blue-600 hover:text-white transition-all duration-300 hover:scale-110"
                            >
                                <Linkedin className="w-4 h-4" />
                            </a>
                        )}
                        {member.twitter && (
                            <a
                                href={member.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-sky-500 hover:text-white transition-all duration-300 hover:scale-110"
                            >
                                <Twitter className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
